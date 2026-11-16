#!/usr/bin/env python3
"""Build interpolation DATA from an approved original pose atlas.
Authoring only: pip install opencv-python-headless numpy. No runtime dependency.
The original image is never retouched. Each pair receives forward/backward dense
correspondence maps, encoded as four RGB tiles per pair (forward x/y, reverse x/y).
"""
import argparse
from pathlib import Path
import cv2
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('atlas', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('--columns', type=int, default=2)
parser.add_argument('--rows', type=int, default=3)
args = parser.parse_args()
if args.columns < 1 or args.rows < 1 or args.columns * args.rows < 2:
    raise SystemExit('Atlas must contain at least two frames in a positive grid')
image = cv2.imread(str(args.atlas))
if image is None:
    raise SystemExit('Atlas could not be decoded')
height, width = image.shape[:2]
if width % args.columns or height % args.rows:
    raise SystemExit('Atlas dimensions must divide into equal frames')
w, h = width // args.columns, height // args.rows
if w < 2 or h < 2:
    raise SystemExit('Frames must be at least 2x2 pixels')
fw, fh = w // 2, h // 2
frames = [image[(i//args.columns)*h:(i//args.columns+1)*h,
                (i%args.columns)*w:(i%args.columns+1)*w]
          for i in range(args.columns*args.rows)]
flow_atlas = np.zeros((fh*(len(frames)-1), fw*4, 3), dtype=np.uint8)
for pair in range(len(frames)-1):
    for direction in range(2):
        a,b = (frames[pair],frames[pair+1]) if direction == 0 else (frames[pair+1],frames[pair])
        a,b = [cv2.resize(cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY),(fw,fh)) for frame in (a,b)]
        solver = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
        solver.setFinestScale(0)
        solver.setGradientDescentIterations(32)
        solver.setVariationalRefinementIterations(12)
        flow = solver.calc(a,b,None) * np.array([w/fw,h/fh],dtype=np.float32)
        if not np.isfinite(flow).all() or np.abs(flow).max() >= 256:
            raise SystemExit('Motion exceeds the flow encoding range')
        packed = (np.round(flow*8)*16+32768).astype(np.uint16)
        for component in range(2):
            values=packed[:,:,component]
            rgb=np.stack((values>>8,values&255,np.zeros_like(values)),axis=-1).astype(np.uint8)
            col=direction*2+component
            flow_atlas[pair*fh:(pair+1)*fh,col*fw:(col+1)*fw]=cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR)
args.output.parent.mkdir(parents=True,exist_ok=True)
if not cv2.imwrite(str(args.output),flow_atlas,[cv2.IMWRITE_PNG_COMPRESSION,9]):
    raise SystemExit('Flow atlas could not be written')
print(f'{len(frames)} frames, flow tiles {fw}x{fh}, atlas {fw*4}x{fh*(len(frames)-1)}: {args.output.stat().st_size} bytes')
