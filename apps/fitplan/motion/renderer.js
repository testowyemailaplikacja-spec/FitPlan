(() => {
  'use strict';
  // The renderer is exercise-agnostic. No clock, animation loop or exercise-specific geometry.
  const vertex = `precision highp float;
    attribute vec2 position; varying vec2 uv;
    uniform sampler2D motion; uniform vec2 frameSize; uniform vec2 flowGrid; uniform vec2 flowSize;
    uniform float pair; uniform float amount; uniform float reverse;
    vec2 cellUV(vec2 p,vec2 cell,vec2 size,vec2 tiles){return (cell+clamp(p,.5/size,1.0-.5/size))/tiles;}
    float component(vec2 p,float col){vec2 v=texture2D(motion,cellUV(p,vec2(col,pair),flowSize,flowGrid)).rg;return (dot(v,vec2(65280.0,255.0))-32768.0)/128.0;}
    void main(){uv=position;vec2 flow=vec2(component(uv,reverse*2.0),component(uv,reverse*2.0+1.0))/frameSize;
      vec2 warped=uv+amount*flow;gl_Position=vec4(warped*vec2(2.0,-2.0)+vec2(-1.0,1.0),0.0,1.0);}`;
  const fragment = `precision highp float;
    varying vec2 uv;uniform sampler2D atlas;uniform vec2 grid;uniform vec2 frameSize;uniform float fromFrame;uniform float opacity;
    void main(){vec2 cell=vec2(mod(fromFrame,grid.x),floor(fromFrame/grid.x));
      vec2 p=(cell+clamp(uv,.5/frameSize,1.0-.5/frameSize))/grid;
      gl_FragColor=vec4(texture2D(atlas,p).rgb,opacity);}`;
  function create(host, definition, onState = () => {}) {
    if(definition.visual.kind==='landmark-rig')return window.FitPlanRigRenderer.create(host,definition,onState);
    if(definition.visual.kind==='full-body-rig')return window.FitPlanFullBodyRenderer.create(host,definition,onState);
    const doc=host.ownerDocument, view=doc.defaultView, visual=definition.visual;
    const posters=[doc.createElement('div'),doc.createElement('div')],canvas=doc.createElement('canvas');
    posters.forEach((poster,index)=>{poster.className='fitplan-motion-poster fitplan-motion-poster-'+(index?'to':'from');poster.setAttribute('aria-hidden','true');});
    canvas.className='fitplan-motion-canvas';canvas.hidden=true;canvas.setAttribute('aria-hidden','true');
    host.style.aspectRatio=visual.width+'/'+visual.height;host.append(...posters,canvas);
    let disposed=false,gl=null,program=null,buffer=null,textures=[],images=[],ready=false,lastPose=null,observer=null;
    let renderState='loading',vertexCount=0;
    const hasFlow=Boolean(visual.atlas&&visual.flow);
    function state(value){renderState=value;host.dataset.renderer=value;if(!disposed)onState(value);}
    function setPosterFrame(poster,frame){
      if(Array.isArray(visual.frames)){
        poster.style.backgroundImage='url("'+visual.frames[frame]+'")';poster.style.backgroundSize='100% 100%';poster.style.backgroundPosition='center';
      }else{
        poster.style.backgroundImage='url("'+visual.atlas+'")';poster.style.backgroundSize=(visual.columns*100)+'% '+(visual.rows*100)+'%';
        poster.style.backgroundPosition=(visual.columns===1?0:(frame%visual.columns)/(visual.columns-1)*100)+'% '+(visual.rows===1?0:Math.floor(frame/visual.columns)/(visual.rows-1)*100)+'%';
      }
    }
    function fallback(pose){
      setPosterFrame(posters[0],pose.from);setPosterFrame(posters[1],pose.to);
      posters[0].style.opacity='1';posters[1].style.opacity=String(pose.from===pose.to?0:pose.mix);
      posters.forEach(poster=>poster.hidden=false);canvas.hidden=true;
    }
    function crossfade(){
      canvas.hidden=true;posters.forEach(poster=>poster.hidden=false);state('crossfade');
    }
    function compile(type, source){
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const reason=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(reason);}
      return shader;
    }
    function texture(image,unit){
      const item=gl.createTexture();textures.push(item);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,item);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    }
    function initialize(){
      if(disposed||!hasFlow||images.length!==2)return;
      try{
        gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
        if(!gl){crossfade();return;}
        const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
        program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
        gl.deleteShader(vs);gl.deleteShader(fs);
        if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Motion shader unavailable');
        gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
        const points=[];const cols=180,rows=90;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const l=x/cols,r=(x+1)/cols,t=y/rows,b=(y+1)/rows;points.push(l,t,r,t,l,b,l,b,r,t,r,b);}vertexCount=points.length/2;gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);
        const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
        texture(images[0],0);texture(images[1],1);
        const uniform=(name,...args)=>gl.uniform2f(gl.getUniformLocation(program,name),...args);
        gl.uniform1i(gl.getUniformLocation(program,'atlas'),0);gl.uniform1i(gl.getUniformLocation(program,'motion'),1);
        uniform('grid',visual.columns,visual.rows);uniform('frameSize',visual.width,visual.height);
        uniform('flowGrid',visual.flow.columns,visual.flow.rows);uniform('flowSize',visual.flow.width,visual.flow.height);
        ready=true;state('smooth');if(lastPose)setPose(lastPose);
      }catch(error){ready=false;crossfade();}
    }
    function setPose(pose){
      if(disposed)return;
      lastPose=pose;fallback(pose);
      if(!ready||!gl||gl.isContextLost())return;
      const pairs=visual.flow.pairs,pair=pairs.findIndex(p=>(p[0]===pose.from&&p[1]===pose.to)||(p[1]===pose.from&&p[0]===pose.to));
      if(pair<0&&pose.from!==pose.to){crossfade();return;}
      const cssWidth=host.getBoundingClientRect().width||visual.width;
      const width=Math.max(2,Math.min(1448,Math.round(cssWidth*Math.min(view.devicePixelRatio||1,2))));
      const height=Math.round(width*visual.height/visual.width);
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);gl.useProgram(program);
      const reverse=pair>=0&&pairs[pair][0]!==pose.from?1:0;
      function draw(frame,amount,direction,opacity){
        for(const [name,value] of Object.entries({fromFrame:frame,pair:Math.max(0,pair),amount,reverse:direction,opacity}))gl.uniform1f(gl.getUniformLocation(program,name),value);
        gl.drawArrays(gl.TRIANGLES,0,vertexCount);
      }
      gl.disable(gl.BLEND);draw(pose.from,pose.mix,reverse,1);
      if(pose.mix>0){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);draw(pose.to,1-pose.mix,1-reverse,pose.mix);gl.disable(gl.BLEND);}
      canvas.hidden=false;posters.forEach(poster=>poster.hidden=true);
      if(renderState!=='smooth')state('smooth');
    }
    function load(url){return new Promise((resolve,reject)=>{
      const img=new view.Image();const clean=()=>{img.onload=null;img.onerror=null;};
      img.onload=()=>{clean();resolve(img);};img.onerror=()=>{clean();reject(new Error('Motion asset failed'));};img.src=url;
    });}
    const assetUrls=Array.isArray(visual.frames)?visual.frames:[visual.atlas,...(hasFlow?[visual.flow.url]:[])];
    const loaded=Promise.all(assetUrls.map(load)).then(result=>{
      if(disposed)return;images=result;
      const primaryOk=Array.isArray(visual.frames)
        ? images.every(image=>image.naturalWidth===visual.width&&image.naturalHeight===visual.height)
        : images[0].naturalWidth===visual.width*visual.columns&&images[0].naturalHeight===visual.height*visual.rows;
      if(!primaryOk){state('asset-error');return;}
      if(!hasFlow){crossfade();return;}
      if(images[1].naturalWidth!==visual.flow.width*visual.flow.columns||images[1].naturalHeight!==visual.flow.height*visual.flow.rows){crossfade();return;}
      initialize();
    }).catch(()=>{if(!disposed)state('asset-error');});
    function lost(event){event.preventDefault();ready=false;crossfade();}
    function restored(){if(hasFlow){textures=[];initialize();}}
    function resize(){if(lastPose)setPose(lastPose);}
    canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
    if(view.ResizeObserver){observer=new view.ResizeObserver(resize);observer.observe(host);}else view.addEventListener('resize',resize);
    state('loading');
    return Object.freeze({setPose,loaded,dispose(){
      if(disposed)return;disposed=true;observer?.disconnect();view.removeEventListener('resize',resize);
      canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);
      if(gl){textures.forEach(item=>gl.deleteTexture(item));if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}
      images=[];canvas.remove();posters.forEach(poster=>poster.remove());
    }});
  }
  Object.defineProperty(window,'FitPlanPoseRenderer',{value:Object.freeze({create})});
})();

