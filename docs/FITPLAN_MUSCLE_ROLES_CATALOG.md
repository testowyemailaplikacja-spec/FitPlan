# FitPlan — aktualny rejestr ćwiczeń i profil mięśni

Stan danych: 23.10.2026, develop. **Procenty podawane dla 116 wcześniejszych ćwiczeń są tylko redakcyjnymi wartościami poglądowymi**, a nie wynikami EMG lub pomiaru obciążenia. Dla 130 nowych ćwiczeń podano wyłącznie role jakościowe, aby nie sugerować nieistniejącej precyzji. Siedem ogólnie nazwanych ruchów wymaga określenia konkretnego wariantu.

Definicje istniejących ćwiczeń: `data/exercise-catalog.js`, `data/kettlebell-catalog.js`. Definicje nowych ćwiczeń: `data/training-extensions.js`. **Jedyny katalog prezentacyjny i źródło referencji wszystkich modułów:** `data/exercise-registry.js`. Progresje zapisują odwołania do tego katalogu.

Źródła metodologiczne: [ACSM 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/), [krytyka interpretacji EMG](https://pmc.ncbi.nlm.nih.gov/articles/PMC5758546/), [wyciskanie](https://pmc.ncbi.nlm.nih.gov/articles/PMC7579505/), [English Boxing](https://www.englandboxing.org/wp-content/uploads/2022/03/EB_Boxing-Coaching-Handbook-Part-1_v8-002.pdf). Wpis źródłowy nie oznacza, że każda wartość procentowa została przez niego potwierdzona.

## Pełna lista 253 unikatowych ćwiczeń

| ID | Nazwa | Mięśnie główne | Mięśnie pomocnicze | Wiarygodność |
| --- | --- | --- | --- | --- |
| `glutes-hip-thrust` | Hip thrust | Pośladkowy wielki 66%; Kulszowo-goleniowe 13% | Czworogłowy uda 11%; Prosty brzucha 10% | model procentowy, poglądowy |
| `legs-przysiady` | Squat | Czworogłowy uda 43%; Pośladkowy wielki 30% | Przywodziciele uda 13%; Prosty brzucha 14% | model procentowy, poglądowy |
| `chest-wyciskanie-sztangi-na-awce-p-askiej` | Barbell Bench Press | Piersiowy większy – część mostkowo-żebrowa 34%; Piersiowy większy – część obojczykowa 22% | Trójgłowy ramienia (triceps) 24%; Naramienny – część przednia 20% | model procentowy, poglądowy |
| `back-martwy-ciag` | Deadlift | Pośladkowy wielki 32%; Kulszowo-goleniowe 30% | Prostowniki grzbietu 26%; Zginacze palców i nadgarstka 12% | model procentowy, poglądowy |
| `back-podciaganie` | Pull-Up | Najszerszy grzbietu 48%; Dwugłowy ramienia (biceps) 18% | Czworoboczny grzbietu 14%; Równoległoboczne 12%; Zginacze palców i nadgarstka 8% | model procentowy, poglądowy |
| `chest-pompki` | Push-Up | Piersiowy większy – część mostkowo-żebrowa 35%; Piersiowy większy – część obojczykowa 18% | Trójgłowy ramienia (triceps) 25%; Naramienny – część przednia 12%; Zębaty przedni 10% | model procentowy, poglądowy |
| `back-wios-owanie` | Row | Najszerszy grzbietu 36%; Równoległoboczne 25% | Czworoboczny grzbietu 16%; Naramienny – część tylna 13%; Dwugłowy ramienia (biceps) 10% | model procentowy, poglądowy |
| `shoulders-wyciskanie-nad-g-owe` | Overhead Press | Naramienny – część przednia 40%; Naramienny – część środkowa 24% | Trójgłowy ramienia (triceps) 19%; Zębaty przedni 17% | model procentowy, poglądowy |
| `back-bird-dog` | Bird dog | Poprzeczny brzucha 40%; Prosty brzucha 28% | Skośne brzucha 20%; Wielodzielne 12% | model procentowy, poglądowy |
| `abs-dead-bug` | Dead bug | Poprzeczny brzucha 40%; Prosty brzucha 28% | Skośne brzucha 20%; Wielodzielne 12% | model procentowy, poglądowy |
| `abs-deska-boczna` | Side Plank | Skośne brzucha 45%; Poprzeczny brzucha 30% | Prosty brzucha 15%; Pośladkowy średni i mały 10% | model procentowy, poglądowy |
| `back-face-pull` | Face pull | Naramienny – część tylna 33%; Czworoboczny grzbietu 24%; Stożek rotatorów 20% | Równoległoboczne 15%; Dwugłowy ramienia (biceps) 8% | model procentowy, poglądowy |
| `abs-pallof-press` | Pallof press | Skośne brzucha 45%; Poprzeczny brzucha 30% | Prosty brzucha 15%; Pośladkowy średni i mały 10% | model procentowy, poglądowy |
| `back-sciaganie-drazka` | Lat Pulldown | Najszerszy grzbietu 48%; Dwugłowy ramienia (biceps) 18% | Czworoboczny grzbietu 14%; Równoległoboczne 12%; Zginacze palców i nadgarstka 8% | model procentowy, poglądowy |
| `shoulders-arnold-press` | Arnold press | Naramienny – część przednia 40%; Naramienny – część środkowa 24% | Trójgłowy ramienia (triceps) 19%; Zębaty przedni 17% | model procentowy, poglądowy |
| `chest-carries` | Carries | Brak przypisania bez określenia wariantu | Brak przypisania bez określenia wariantu | wymaga określenia wariantu |
| `arms-dipy` | Dips | Trójgłowy ramienia (triceps) 38%; Piersiowy większy – część mostkowo-żebrowa 30% | Naramienny – część przednia 22%; Zębaty przedni 10% | model procentowy, poglądowy |
| `chest-landmine-press` | Landmine press | Naramienny – część przednia 40%; Naramienny – część środkowa 24% | Trójgłowy ramienia (triceps) 19%; Zębaty przedni 17% | model procentowy, poglądowy |
| `arms-podciaganie-podchwytem` | Chin-Up | Najszerszy grzbietu 48%; Dwugłowy ramienia (biceps) 18% | Czworoboczny grzbietu 14%; Równoległoboczne 12%; Zginacze palców i nadgarstka 8% | model procentowy, poglądowy |
| `glutes-side-step` | Side step | Pośladkowy średni i mały 70% | Pośladkowy wielki 20%; Prosty brzucha 10% | model procentowy, poglądowy |
| `forearms-spacer-farmera` | Farmer's Carry | Zginacze palców i nadgarstka 38%; Skośne brzucha 22% | Czworoboczny grzbietu 16%; Prostowniki grzbietu 14%; Pośladkowy wielki 10% | model procentowy, poglądowy |
| `legs-sumo-squat` | Sumo squat | Czworogłowy uda 43%; Pośladkowy wielki 30% | Przywodziciele uda 13%; Prosty brzucha 14% | model procentowy, poglądowy |
| `chest-wyciskanie-hantli-na-awce-dodatniej` | Incline Dumbbell Bench Press | Piersiowy większy – część mostkowo-żebrowa 34%; Piersiowy większy – część obojczykowa 22% | Trójgłowy ramienia (triceps) 24%; Naramienny – część przednia 20% | model procentowy, poglądowy |
| `arms-wyciskanie-wasko` | Close-Grip Bench Press | Piersiowy większy – część mostkowo-żebrowa 34%; Piersiowy większy – część obojczykowa 22% | Trójgłowy ramienia (triceps) 24%; Naramienny – część przednia 20% | model procentowy, poglądowy |
| `legs-wykroki` | Lunge | Czworogłowy uda 37%; Pośladkowy wielki 32% | Pośladkowy średni i mały 17%; Łydka (brzuchaty i płaszczkowaty) 14% | model procentowy, poglądowy |
| `abs-antyrotacja` | Anti-Rotation Hold | Skośne brzucha 45%; Poprzeczny brzucha 30% | Prosty brzucha 15%; Pośladkowy średni i mały 10% | model procentowy, poglądowy |
| `back-cwiczenia-antyrotacyjne` | Anti-Rotation Exercises | Brak przypisania bez określenia wariantu | Brak przypisania bez określenia wariantu | wymaga określenia wariantu |
| `chest-cwiczenia-kontroli-barku` | Shoulder Control Drills | Brak przypisania bez określenia wariantu | Brak przypisania bez określenia wariantu | wymaga określenia wariantu |
| `chest-cwiczenia-oddechowe` | Breathing Exercises | Przepona 70% | Prosty brzucha 15%; Poprzeczny brzucha 15% | model procentowy, poglądowy |
| `shoulders-face-pull-z-rotacja` | Face Pull with External Rotation | Naramienny – część tylna 33%; Czworoboczny grzbietu 24%; Stożek rotatorów 20% | Równoległoboczne 15%; Dwugłowy ramienia (biceps) 8% | model procentowy, poglądowy |
| `back-izometrie` | Isometric Holds | Brak przypisania bez określenia wariantu | Brak przypisania bez określenia wariantu | wymaga określenia wariantu |
| `glutes-kontrolowana-rotacja-biodra` | Controlled Hip Rotation | Pośladkowy średni i mały 41%; Pośladkowy wielki 24% | Zginacze biodra 20%; Prosty brzucha 15% | model procentowy, poglądowy |
| `chest-kontrolowane-obnizanie-opatek` | Scapular Depression | Czworoboczny grzbietu 38%; Zębaty przedni 32% | Równoległoboczne 20%; Stożek rotatorów 10% | model procentowy, poglądowy |
| `abs-kontrolowane-skrety-tu-owia` | Controlled Trunk Rotation | Skośne brzucha 45%; Poprzeczny brzucha 30% | Prosty brzucha 15%; Pośladkowy średni i mały 10% | model procentowy, poglądowy |
| `legs-kontrolowane-unoszenie-kolana` | Controlled Knee Raise | Zginacze biodra 48%; Prosty brzucha 32% | Skośne brzucha 20% | model procentowy, poglądowy |
| `back-kontrolowane-unoszenie-opatek` | Scapular Elevation | Czworoboczny grzbietu 77% | Zginacze palców i nadgarstka 13%; Stożek rotatorów 10% | model procentowy, poglądowy |
| `legs-kontrolowane-zgiecie-biodra` | Controlled Hip Flexion | Zginacze biodra 48%; Prosty brzucha 32% | Skośne brzucha 20% | model procentowy, poglądowy |
| `legs-marsz` | Walking | Łydka (brzuchaty i płaszczkowaty) 39%; Czworogłowy uda 31% | Pośladkowy wielki 20%; Prosty brzucha 10% | model procentowy, poglądowy |
| `legs-marsz-na-pietach` | Heel Walk | Mięśnie podudzia i stawu skokowego 82% | Łydka (brzuchaty i płaszczkowaty) 18% | model procentowy, poglądowy |
| `legs-marsz-pod-gore` | Uphill Walk | Łydka (brzuchaty i płaszczkowaty) 39%; Czworogłowy uda 31% | Pośladkowy wielki 20%; Prosty brzucha 10% | model procentowy, poglądowy |
| `legs-marsze-z-oporem` | Resisted March | Zginacze palców i nadgarstka 38%; Skośne brzucha 22% | Czworoboczny grzbietu 16%; Prostowniki grzbietu 14%; Pośladkowy wielki 10% | model procentowy, poglądowy |
| `forearms-nawracanie-przedramienia-z-ma-ym-oporem` | Resisted Forearm Pronation | Zginacze palców i nadgarstka 80% | Prostowniki przedramienia 20% | model procentowy, poglądowy |
| `legs-nawracanie-stopy-z-guma` | Band Ankle Eversion | Mięśnie podudzia i stawu skokowego 82% | Łydka (brzuchaty i płaszczkowaty) 18% | model procentowy, poglądowy |
| `forearms-odwracanie-przedramienia-z-ma-ym-oporem` | Resisted Forearm Supination | Zginacze palców i nadgarstka 80% | Prostowniki przedramienia 20% | model procentowy, poglądowy |
| `legs-odwracanie-stopy-z-guma` | Band Ankle Inversion | Mięśnie podudzia i stawu skokowego 82% | Łydka (brzuchaty i płaszczkowaty) 18% | model procentowy, poglądowy |
| `forearms-prostowanie-palcow-z-guma` | Band Finger Extension | Prostowniki przedramienia 80% | Zginacze palców i nadgarstka 20% | model procentowy, poglądowy |
| `shoulders-rotacje-zewnetrzne-guma` | Band External Rotation | Stożek rotatorów 80% | Naramienny – część tylna 20% | model procentowy, poglądowy |
| `chest-spokojny-oddech-przeponowy` | Diaphragmatic Breathing | Przepona 70% | Prosty brzucha 15%; Poprzeczny brzucha 15% | model procentowy, poglądowy |
| `chest-wall-slides` | Wall slides | Czworoboczny grzbietu 38%; Zębaty przedni 32% | Równoległoboczne 20%; Stożek rotatorów 10% | model procentowy, poglądowy |
| `legs-addukcja-z-oporem` | Resisted Hip Adduction | Przywodziciele uda 70% | Prosty brzucha 20%; Pośladkowy średni i mały 10% | model procentowy, poglądowy |
| `back-back-extension` | Back extension | Prostowniki grzbietu 62%; Pośladkowy wielki 23% | Kulszowo-goleniowe 15% | model procentowy, poglądowy |
| `chest-bracing` | Bracing | Brak przypisania bez określenia wariantu | Brak przypisania bez określenia wariantu | wymaga określenia wariantu |
| `legs-chod-bokiem` | Side Steps | Pośladkowy średni i mały 70% | Pośladkowy wielki 20%; Prosty brzucha 10% | model procentowy, poglądowy |
| `glutes-chod-bokiem-z-guma` | Lateral Band Walk | Pośladkowy średni i mały 70% | Pośladkowy wielki 20%; Prosty brzucha 10% | model procentowy, poglądowy |
| `legs-copenhagen-plank` | Copenhagen plank | Przywodziciele uda 70% | Prosty brzucha 20%; Pośladkowy średni i mały 10% | model procentowy, poglądowy |
| `glutes-cwiczenie-muszla` | Clamshell | Pośladkowy średni i mały 70% | Pośladkowy wielki 20%; Prosty brzucha 10% | model procentowy, poglądowy |
| `legs-dorsiflexion-raises` | Dorsiflexion raises | Mięśnie podudzia i stawu skokowego 82% | Łydka (brzuchaty i płaszczkowaty) 18% | model procentowy, poglądowy |
| `back-hip-hinge` | Hip hinge | Pośladkowy wielki 32%; Kulszowo-goleniowe 30% | Prostowniki grzbietu 26%; Zginacze palców i nadgarstka 12% | model procentowy, poglądowy |
| `abs-hollow-hold` | Hollow hold | Poprzeczny brzucha 40%; Prosty brzucha 28% | Skośne brzucha 20%; Wielodzielne 12% | model procentowy, poglądowy |
| `glutes-monster-walk` | Monster walk | Pośladkowy średni i mały 70% | Pośladkowy wielki 20%; Prosty brzucha 10% | model procentowy, poglądowy |
| `legs-odwodzenie-biodra` | Hip Abduction | Pośladkowy średni i mały 70% | Pośladkowy wielki 20%; Prosty brzucha 10% | model procentowy, poglądowy |
| `arms-prostowania-na-wyciagu` | Cable Triceps Pushdown | Trójgłowy ramienia (triceps) 72% | Naramienny – część przednia 15%; Piersiowy większy – część mostkowo-żebrowa 13% | model procentowy, poglądowy |
| `forearms-prostowanie-nadgarstkow` | Wrist Extension | Prostowniki przedramienia 80% | Zginacze palców i nadgarstka 20% | model procentowy, poglądowy |
| `legs-prostowanie-nog` | Leg Extension | Czworogłowy uda 85% | Zginacze biodra 15% | model procentowy, poglądowy |
| `chest-push-up-plus` | Push-up plus | Piersiowy większy – część mostkowo-żebrowa 35%; Piersiowy większy – część obojczykowa 18% | Trójgłowy ramienia (triceps) 25%; Naramienny – część przednia 12%; Zębaty przedni 10% | model procentowy, poglądowy |
| `legs-rdl` | RDL | Pośladkowy wielki 32%; Kulszowo-goleniowe 30% | Prostowniki grzbietu 26%; Zginacze palców i nadgarstka 12% | model procentowy, poglądowy |
| `chest-rozpietki-na-awce` | Dumbbell Chest Fly | Piersiowy większy – część mostkowo-żebrowa 45%; Piersiowy większy – część obojczykowa 30% | Naramienny – część przednia 15%; Zębaty przedni 10% | model procentowy, poglądowy |
| `back-shrugsy` | Shrugs | Czworoboczny grzbietu 77% | Zginacze palców i nadgarstka 13%; Stożek rotatorów 10% | model procentowy, poglądowy |
| `glutes-single-leg-work` | Single-leg work | Brak przypisania bez określenia wariantu | Brak przypisania bez określenia wariantu | wymaga określenia wariantu |
| `legs-skakanka` | Jump Rope | Łydka (brzuchaty i płaszczkowaty) 39%; Czworogłowy uda 31% | Pośladkowy wielki 20%; Prosty brzucha 10% | model procentowy, poglądowy |
| `legs-skoki` | Jumps | Łydka (brzuchaty i płaszczkowaty) 39%; Czworogłowy uda 31% | Pośladkowy wielki 20%; Prosty brzucha 10% | model procentowy, poglądowy |
| `abs-spacer-z-obciazeniem-po-jednej-stronie` | Suitcase Carry | Zginacze palców i nadgarstka 38%; Skośne brzucha 22% | Czworoboczny grzbietu 16%; Prostowniki grzbietu 14%; Pośladkowy wielki 10% | model procentowy, poglądowy |
| `abs-spiecia` | Crunch | Prosty brzucha 65%; Skośne brzucha 20% | Zginacze biodra 15% | model procentowy, poglądowy |
| `chest-stabilizacja-opatki` | Scapular Stabilization | Brak przypisania bez określenia wariantu | Brak przypisania bez określenia wariantu | wymaga określenia wariantu |
| `legs-stanie-jednonoz` | Single-Leg Balance | Pośladkowy średni i mały 40%; Mięśnie podudzia i stawu skokowego 30% | Poprzeczny brzucha 20%; Łydka (brzuchaty i płaszczkowaty) 10% | model procentowy, poglądowy |
| `back-sciaganie-opatek` | Scapular Retraction | Czworoboczny grzbietu 38%; Zębaty przedni 32% | Równoległoboczne 20%; Stożek rotatorów 10% | model procentowy, poglądowy |
| `arms-uginania-hantli` | Dumbbell Biceps Curl | Dwugłowy ramienia (biceps) 58%; Ramienny i ramienno-promieniowy 27% | Zginacze palców i nadgarstka 15% | model procentowy, poglądowy |
| `legs-uginania-nog` | Leg Curl | Kulszowo-goleniowe 78% | Pośladkowy wielki 12%; Łydka (brzuchaty i płaszczkowaty) 10% | model procentowy, poglądowy |
| `arms-uginania-ze-sztanga` | Barbell Biceps Curl | Dwugłowy ramienia (biceps) 58%; Ramienny i ramienno-promieniowy 27% | Zginacze palców i nadgarstka 15% | model procentowy, poglądowy |
| `forearms-uginanie-m-otkowe` | Hammer Curl | Dwugłowy ramienia (biceps) 58%; Ramienny i ramienno-promieniowy 27% | Zginacze palców i nadgarstka 15% | model procentowy, poglądowy |
| `forearms-uginanie-nachwytem` | Reverse Curl | Dwugłowy ramienia (biceps) 58%; Ramienny i ramienno-promieniowy 27% | Zginacze palców i nadgarstka 15% | model procentowy, poglądowy |
| `forearms-uginanie-nadgarstkow` | Wrist Curl | Dwugłowy ramienia (biceps) 58%; Ramienny i ramienno-promieniowy 27% | Zginacze palców i nadgarstka 15% | model procentowy, poglądowy |
| `shoulders-unoszenia-bokiem` | Lateral Raise | Naramienny – część środkowa 56%; Naramienny – część przednia 17% | Czworoboczny grzbietu 16%; Stożek rotatorów 11% | model procentowy, poglądowy |
| `legs-unoszenia-kolan` | Knee Raise | Zginacze biodra 48%; Prosty brzucha 32% | Skośne brzucha 20% | model procentowy, poglądowy |
| `abs-unoszenia-nog` | Leg Raise | Prosty brzucha 65%; Skośne brzucha 20% | Zginacze biodra 15% | model procentowy, poglądowy |
| `legs-wejscia-na-stopien` | Step-Up | Czworogłowy uda 37%; Pośladkowy wielki 32% | Pośladkowy średni i mały 17%; Łydka (brzuchaty i płaszczkowaty) 14% | model procentowy, poglądowy |
| `abs-woodchopper` | Woodchopper | Skośne brzucha 45%; Poprzeczny brzucha 30% | Prosty brzucha 15%; Pośladkowy średni i mały 10% | model procentowy, poglądowy |
| `legs-wspiecia-na-palce` | Calf Raise | Łydka (brzuchaty i płaszczkowaty) 85% | Mięśnie podudzia i stawu skokowego 15% | model procentowy, poglądowy |
| `legs-wspiecia-siedzac` | Seated Calf Raise | Łydka (brzuchaty i płaszczkowaty) 85% | Mięśnie podudzia i stawu skokowego 15% | model procentowy, poglądowy |
| `legs-wspiecia-stojac` | Standing Calf Raise | Łydka (brzuchaty i płaszczkowaty) 85% | Mięśnie podudzia i stawu skokowego 15% | model procentowy, poglądowy |
| `shoulders-y-raise` | Y-raise | Czworoboczny grzbietu 38%; Zębaty przedni 32% | Równoległoboczne 20%; Stożek rotatorów 10% | model procentowy, poglądowy |
| `forearms-zwis-na-drazku` | Dead Hang | Zginacze palców i nadgarstka 55%; Stożek rotatorów 20% | Najszerszy grzbietu 15%; Czworoboczny grzbietu 10% | model procentowy, poglądowy |
| `legs-good-morning` | Good morning | Pośladkowy wielki 32%; Kulszowo-goleniowe 30% | Prostowniki grzbietu 26%; Zginacze palców i nadgarstka 12% | model procentowy, poglądowy |
| `abs-rollouty` | Ab Wheel Rollout | Poprzeczny brzucha 40%; Prosty brzucha 28% | Skośne brzucha 20%; Wielodzielne 12% | model procentowy, poglądowy |
| `kb-deadlift` | Kettlebell Deadlift | Pośladkowy wielki 32%; Kulszowo-goleniowe 30% | Prostowniki grzbietu 26%; Zginacze palców i nadgarstka 12% | model procentowy, poglądowy |
| `kb-goblet-squat` | Goblet Squat | Czworogłowy uda 43%; Pośladkowy wielki 30% | Przywodziciele uda 13%; Prosty brzucha 14% | model procentowy, poglądowy |
| `kb-halo` | Kettlebell Halo | Naramienny – część środkowa 56%; Naramienny – część przednia 17% | Czworoboczny grzbietu 16%; Stożek rotatorów 11% | model procentowy, poglądowy |
| `kb-floor-press` | Kettlebell Floor Press | Piersiowy większy – część mostkowo-żebrowa 41%; Piersiowy większy – część obojczykowa 17% | Trójgłowy ramienia (triceps) 26%; Naramienny – część przednia 16% | model procentowy, poglądowy |
| `kb-one-arm-floor-press` | Single-Arm Floor Press | Piersiowy większy – część mostkowo-żebrowa 41%; Piersiowy większy – część obojczykowa 17% | Trójgłowy ramienia (triceps) 26%; Naramienny – część przednia 16% | model procentowy, poglądowy |
| `kb-row` | Single-Arm Kettlebell Row | Najszerszy grzbietu 36%; Równoległoboczne 25% | Czworoboczny grzbietu 16%; Naramienny – część tylna 13%; Dwugłowy ramienia (biceps) 10% | model procentowy, poglądowy |
| `kb-rdl` | Kettlebell Romanian Deadlift | Pośladkowy wielki 32%; Kulszowo-goleniowe 30% | Prostowniki grzbietu 26%; Zginacze palców i nadgarstka 12% | model procentowy, poglądowy |
| `kb-reverse-lunge` | Kettlebell Reverse Lunge | Czworogłowy uda 37%; Pośladkowy wielki 32% | Pośladkowy średni i mały 17%; Łydka (brzuchaty i płaszczkowaty) 14% | model procentowy, poglądowy |
| `kb-split-squat` | Kettlebell Split Squat | Czworogłowy uda 43%; Pośladkowy wielki 30% | Przywodziciele uda 13%; Prosty brzucha 14% | model procentowy, poglądowy |
| `kb-glute-bridge` | Kettlebell Glute Bridge | Pośladkowy wielki 66%; Kulszowo-goleniowe 13% | Czworogłowy uda 11%; Prosty brzucha 10% | model procentowy, poglądowy |
| `kb-march` | Suitcase March | Zginacze palców i nadgarstka 38%; Skośne brzucha 22% | Czworoboczny grzbietu 16%; Prostowniki grzbietu 14%; Pośladkowy wielki 10% | model procentowy, poglądowy |
| `kb-curl` | Kettlebell Biceps Curl | Dwugłowy ramienia (biceps) 58%; Ramienny i ramienno-promieniowy 27% | Zginacze palców i nadgarstka 15% | model procentowy, poglądowy |
| `kb-triceps-extension` | Kettlebell Triceps Extension | Trójgłowy ramienia (triceps) 72% | Naramienny – część przednia 15%; Piersiowy większy – część mostkowo-żebrowa 13% | model procentowy, poglądowy |
| `kb-squeeze-press` | Kettlebell Squeeze Floor Press | Piersiowy większy – część mostkowo-żebrowa 41%; Piersiowy większy – część obojczykowa 17% | Trójgłowy ramienia (triceps) 26%; Naramienny – część przednia 16% | model procentowy, poglądowy |
| `kb-strict-press` | Kettlebell Strict Press | Naramienny – część przednia 40%; Naramienny – część środkowa 24% | Trójgłowy ramienia (triceps) 19%; Zębaty przedni 17% | model procentowy, poglądowy |
| `kb-rack-carry` | Front Rack Carry | Zginacze palców i nadgarstka 38%; Skośne brzucha 22% | Czworoboczny grzbietu 16%; Prostowniki grzbietu 14%; Pośladkowy wielki 10% | model procentowy, poglądowy |
| `kb-rack-squat` | Front Rack Squat | Czworogłowy uda 43%; Pośladkowy wielki 30% | Przywodziciele uda 13%; Prosty brzucha 14% | model procentowy, poglądowy |
| `kb-two-hand-swing` | Two-Hand Kettlebell Swing | Pośladkowy wielki 42%; Kulszowo-goleniowe 27% | Prostowniki grzbietu 16%; Prosty brzucha 8%; Zginacze palców i nadgarstka 7% | model procentowy, poglądowy |
| `kb-push-press` | Kettlebell Push Press | Naramienny – część przednia 35%; Naramienny – część środkowa 20% | Czworogłowy uda 20%; Pośladkowy wielki 9%; Trójgłowy ramienia (triceps) 11%; Zębaty przedni 5% | model procentowy, poglądowy |
| `kb-supported-renegade-row` | Supported Renegade Row | Najszerszy grzbietu 41%; Równoległoboczne 21% | Prosty brzucha 18%; Skośne brzucha 12%; Dwugłowy ramienia (biceps) 8% | model procentowy, poglądowy |
| `kb-overhead-carry` | Overhead Carry | Zginacze palców i nadgarstka 38%; Skośne brzucha 22% | Czworoboczny grzbietu 16%; Prostowniki grzbietu 14%; Pośladkowy wielki 10% | model procentowy, poglądowy |
| `kb-clean` | Kettlebell Clean | Pośladkowy wielki 29%; Czworogłowy uda 19%; Naramienny – część przednia 14% | Prostowniki grzbietu 14%; Czworoboczny grzbietu 12%; Zginacze palców i nadgarstka 12% | model procentowy, poglądowy |
| `kb-one-arm-swing` | One-Arm Kettlebell Swing | Pośladkowy wielki 42%; Kulszowo-goleniowe 27% | Prostowniki grzbietu 16%; Prosty brzucha 8%; Zginacze palców i nadgarstka 7% | model procentowy, poglądowy |
| `kb-windmill` | Kettlebell Windmill | Skośne brzucha 30%; Pośladkowy średni i mały 22%; Stożek rotatorów 20% | Prosty brzucha 15%; Zginacze palców i nadgarstka 13% | model procentowy, poglądowy |
| `kb-turkish-getup` | Turkish Get-Up | Skośne brzucha 30%; Pośladkowy średni i mały 22%; Stożek rotatorów 20% | Prosty brzucha 15%; Zginacze palców i nadgarstka 13% | model procentowy, poglądowy |
| `kb-thruster` | Kettlebell Thruster | Czworogłowy uda 32%; Pośladkowy wielki 20%; Naramienny – część przednia 19% | Trójgłowy ramienia (triceps) 16%; Prosty brzucha 13% | model procentowy, poglądowy |
| `kb-snatch` | Kettlebell Snatch | Pośladkowy wielki 29%; Czworogłowy uda 19%; Naramienny – część przednia 14% | Prostowniki grzbietu 14%; Czworoboczny grzbietu 12%; Zginacze palców i nadgarstka 12% | model procentowy, poglądowy |
| `kb-jerk` | Kettlebell Jerk | Pośladkowy wielki 29%; Czworogłowy uda 19%; Naramienny – część przednia 14% | Prostowniki grzbietu 14%; Czworoboczny grzbietu 12%; Zginacze palców i nadgarstka 12% | model procentowy, poglądowy |
| `kb-bottoms-up-press` | Bottoms-Up Press | Naramienny – część przednia 40%; Naramienny – część środkowa 24% | Trójgłowy ramienia (triceps) 19%; Zębaty przedni 17% | model procentowy, poglądowy |
| `fx-incline-push-up` | Incline Push-Up | Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-wall-push-up` | Wall Push-Up | Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-knee-push-up` | Knee Push-Up | Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-slow-tempo-push-up` | Slow Tempo Push-Up | Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-decline-push-up` | Decline Push-Up | Mięśnie piersiowe; Naramienne i stabilizatory łopatki | Zginacze i prostowniki ramion; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-archer-push-up` | Archer Push-Up | Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-one-arm-assisted-push-up` | One-Arm Assisted Push-Up | Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-scapular-pull-up` | Scapular Pull-Up | Mięśnie grzbietu | Naramienne i stabilizatory łopatki; Zginacze i prostowniki ramion; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-band-assisted-pull-up` | Band-Assisted Pull-Up | Mięśnie grzbietu; Zginacze i prostowniki ramion | Mięśnie chwytu i przedramienia; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-foot-assisted-pull-up` | Foot-Assisted Pull-Up | Mięśnie grzbietu; Zginacze i prostowniki ramion | Mięśnie chwytu i przedramienia; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-eccentric-pull-up` | Eccentric Pull-Up | Mięśnie grzbietu; Zginacze i prostowniki ramion | Mięśnie chwytu i przedramienia; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-inverted-row` | Inverted Row | Mięśnie grzbietu; Zginacze i prostowniki ramion | Mięśnie chwytu i przedramienia; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-chest-to-bar-pull-up` | Chest-to-Bar Pull-Up | Mięśnie grzbietu; Zginacze i prostowniki ramion | Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-explosive-high-pull-up` | Explosive High Pull-Up | Mięśnie grzbietu; Zginacze i prostowniki ramion | Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-lower-chest-high-pull-up` | Lower-Chest High Pull-Up | Mięśnie grzbietu; Zginacze i prostowniki ramion | Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-parallel-bar-support-hold` | Parallel Bar Support Hold | Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-band-assisted-dip` | Band-Assisted Dip | Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-eccentric-dip` | Eccentric Dip | Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-straight-bar-dip` | Straight-Bar Dip | Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-low-bar-muscle-up-transition` | Low-Bar Muscle-Up Transition | Mięśnie grzbietu; Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-band-assisted-bar-muscle-up` | Band-Assisted Bar Muscle-Up | Mięśnie grzbietu; Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-strict-bar-muscle-up` | Strict Bar Muscle-Up | Mięśnie grzbietu; Mięśnie piersiowe; Zginacze i prostowniki ramion | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-wrist-preparation` | Wrist Preparation | Mięśnie chwytu i przedramienia | Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-scapular-protraction-hold` | Scapular Protraction Hold | Naramienne i stabilizatory łopatki | Mięśnie piersiowe; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-frog-stand` | Frog Stand | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Mięśnie chwytu i przedramienia; Mięśnie piersiowe | opis jakościowy |
| `fx-planche-lean` | Planche Lean | Naramienne i stabilizatory łopatki; Mięśnie piersiowe | Zginacze i prostowniki ramion; Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-pseudo-planche-push-up` | Pseudo Planche Push-Up | Mięśnie piersiowe; Naramienne i stabilizatory łopatki; Zginacze i prostowniki ramion | Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-tuck-planche` | Tuck Planche | Naramienne i stabilizatory łopatki; Mięśnie piersiowe | Zginacze i prostowniki ramion; Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-advanced-tuck-planche` | Advanced Tuck Planche | Naramienne i stabilizatory łopatki; Mięśnie piersiowe | Zginacze i prostowniki ramion; Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-straddle-planche` | Straddle Planche | Naramienne i stabilizatory łopatki; Mięśnie piersiowe | Zginacze i prostowniki ramion; Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-full-planche` | Full Planche | Naramienne i stabilizatory łopatki; Mięśnie piersiowe | Zginacze i prostowniki ramion; Mięśnie brzucha i stabilizatory tułowia; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-reverse-crunch` | Reverse Crunch | Mięśnie brzucha i stabilizatory tułowia | Zginacze biodra | opis jakościowy |
| `fx-candlestick-raise` | Candlestick Raise | Mięśnie brzucha i stabilizatory tułowia | Zginacze biodra; Mięśnie grzbietu | opis jakościowy |
| `fx-tuck-dragon-flag-negative` | Tuck Dragon Flag Negative | Mięśnie brzucha i stabilizatory tułowia | Mięśnie grzbietu; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-one-leg-dragon-flag-negative` | One-Leg Dragon Flag Negative | Mięśnie brzucha i stabilizatory tułowia | Mięśnie grzbietu; Mięśnie pośladkowe | opis jakościowy |
| `fx-dragon-flag-negative` | Dragon Flag Negative | Mięśnie brzucha i stabilizatory tułowia | Mięśnie grzbietu; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-dragon-flag` | Dragon Flag | Mięśnie brzucha i stabilizatory tułowia | Mięśnie grzbietu; Naramienne i stabilizatory łopatki; Mięśnie pośladkowe | opis jakościowy |
| `fx-tuck-front-lever` | Tuck Front Lever | Mięśnie grzbietu; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Naramienne i stabilizatory łopatki; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-advanced-tuck-front-lever` | Advanced Tuck Front Lever | Mięśnie grzbietu; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Naramienne i stabilizatory łopatki; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-one-leg-front-lever` | One-Leg Front Lever | Mięśnie grzbietu; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Naramienne i stabilizatory łopatki; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-straddle-front-lever` | Straddle Front Lever | Mięśnie grzbietu; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Naramienne i stabilizatory łopatki; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-full-front-lever` | Full Front Lever | Mięśnie grzbietu; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Naramienne i stabilizatory łopatki; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-tuck-back-lever` | Tuck Back Lever | Naramienne i stabilizatory łopatki; Mięśnie grzbietu | Mięśnie piersiowe; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-advanced-tuck-back-lever` | Advanced Tuck Back Lever | Naramienne i stabilizatory łopatki; Mięśnie grzbietu | Mięśnie piersiowe; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-straddle-back-lever` | Straddle Back Lever | Naramienne i stabilizatory łopatki; Mięśnie grzbietu | Mięśnie piersiowe; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-full-back-lever` | Full Back Lever | Naramienne i stabilizatory łopatki; Mięśnie grzbietu | Mięśnie piersiowe; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-seated-compression-lift` | Seated Compression Lift | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | Mięśnie czworogłowe | opis jakościowy |
| `fx-tuck-l-sit` | Tuck L-Sit | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | Zginacze i prostowniki ramion; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-one-leg-l-sit` | One-Leg L-Sit | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | Zginacze i prostowniki ramion; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-l-sit` | L-Sit | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | Zginacze i prostowniki ramion; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-v-sit` | V-Sit | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | Zginacze i prostowniki ramion; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-wall-plank` | Wall Plank | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion | opis jakościowy |
| `fx-wall-walk` | Wall Walk | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-wall-handstand-hold` | Wall Handstand Hold | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-handstand-exit-drill` | Handstand Exit Drill | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion | opis jakościowy |
| `fx-freestanding-handstand` | Freestanding Handstand | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-pike-push-up` | Pike Push-Up | Naramienne i stabilizatory łopatki; Zginacze i prostowniki ramion | Mięśnie piersiowe; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-wall-assisted-handstand-push-up` | Wall-Assisted Handstand Push-Up | Naramienne i stabilizatory łopatki; Zginacze i prostowniki ramion | Mięśnie piersiowe; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-freestanding-handstand-push-up` | Freestanding Handstand Push-Up | Naramienne i stabilizatory łopatki; Zginacze i prostowniki ramion | Mięśnie piersiowe; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-supported-pistol-squat` | Supported Pistol Squat | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-eccentric-pistol-squat` | Eccentric Pistol Squat | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-pistol-squat` | Pistol Squat | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia; Stabilizatory stawu skokowego | opis jakościowy |
| `fx-vertical-human-flag-hold` | Vertical Human Flag Hold | Mięśnie brzucha i stabilizatory tułowia; Naramienne i stabilizatory łopatki | Mięśnie grzbietu; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-tuck-human-flag` | Tuck Human Flag | Mięśnie brzucha i stabilizatory tułowia; Naramienne i stabilizatory łopatki | Mięśnie grzbietu; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-straddle-human-flag` | Straddle Human Flag | Mięśnie brzucha i stabilizatory tułowia; Naramienne i stabilizatory łopatki | Mięśnie grzbietu; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-human-flag` | Human Flag | Mięśnie brzucha i stabilizatory tułowia; Naramienne i stabilizatory łopatki | Mięśnie grzbietu; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-cartwheel-fundamentals` | Cartwheel Fundamentals | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Mięśnie ud i podudzi; Mięśnie chwytu i przedramienia | opis jakościowy |
| `fx-round-off-fundamentals` | Round-Off Fundamentals | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Mięśnie ud i podudzi | opis jakościowy |
| `fx-aerial-cartwheel` | Aerial Cartwheel | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia; Mięśnie ud i podudzi | Mięśnie grzbietu | opis jakościowy |
| `fx-front-handspring` | Front Handspring | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia; Mięśnie ud i podudzi | Mięśnie grzbietu | opis jakościowy |
| `fx-back-handspring` | Back Handspring | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia; Mięśnie ud i podudzi | Mięśnie grzbietu | opis jakościowy |
| `fx-front-tuck-somersault` | Front Tuck Somersault | Mięśnie brzucha i stabilizatory tułowia; Mięśnie ud i podudzi | Mięśnie grzbietu; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-back-tuck-somersault` | Back Tuck Somersault | Mięśnie brzucha i stabilizatory tułowia; Mięśnie ud i podudzi | Mięśnie grzbietu; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-burpee` | Burpee | Całe ciało | Mięśnie piersiowe; Mięśnie ud i podudzi; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-box-step-up` | Box Step-Up | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-box-jump` | Box Jump | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie łydki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-medicine-ball-thruster` | Medicine Ball Thruster | Mięśnie ud i podudzi; Naramienne i stabilizatory łopatki | Zginacze i prostowniki ramion; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-wall-ball-shot` | Wall Ball Shot | Mięśnie ud i podudzi; Naramienne i stabilizatory łopatki | Zginacze i prostowniki ramion; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-rowing-ergometer` | Rowing Ergometer | Całe ciało | Mięśnie grzbietu; Mięśnie ud i podudzi; Zginacze i prostowniki ramion | opis jakościowy |
| `fx-air-bike-intervals` | Air Bike Intervals | Całe ciało | Mięśnie ud i podudzi; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-shuttle-run` | Shuttle Run | Mięśnie ud i podudzi | Mięśnie pośladkowe; Mięśnie łydki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-jump-rope-intervals` | Jump Rope Intervals | Mięśnie ud i podudzi | Mięśnie łydki; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-double-under-practice` | Double-Under Practice | Mięśnie ud i podudzi | Mięśnie łydki; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-ski-ergometer` | Ski Ergometer | Całe ciało | Mięśnie grzbietu; Zginacze i prostowniki ramion; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-assault-bike-sprint` | Assault Bike Sprint | Mięśnie ud i podudzi | Zginacze i prostowniki ramion; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-shadow-boxing-stance` | Shadow Boxing Stance | Mięśnie ud i podudzi; Mięśnie brzucha i stabilizatory tułowia | Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-boxing-footwork-forward-back` | Boxing Footwork Forward-Back | Mięśnie ud i podudzi | Mięśnie łydki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-boxing-lateral-step` | Boxing Lateral Step | Mięśnie ud i podudzi | Mięśnie łydki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-boxing-pivot` | Boxing Pivot | Mięśnie ud i podudzi; Mięśnie brzucha i stabilizatory tułowia | Mięśnie pośladkowe | opis jakościowy |
| `fx-jab-shadow-boxing` | Jab Shadow Boxing | Naramienne i stabilizatory łopatki; Zginacze i prostowniki ramion | Mięśnie piersiowe; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-rear-cross-shadow-boxing` | Rear Cross Shadow Boxing | Naramienne i stabilizatory łopatki; Zginacze i prostowniki ramion | Mięśnie piersiowe; Mięśnie brzucha i stabilizatory tułowia; Mięśnie pośladkowe | opis jakościowy |
| `fx-jab-cross-combination-drill` | Jab-Cross Combination Drill | Naramienne i stabilizatory łopatki; Zginacze i prostowniki ramion | Mięśnie brzucha i stabilizatory tułowia; Mięśnie ud i podudzi | opis jakościowy |
| `fx-lead-hook-shadow-boxing` | Lead Hook Shadow Boxing | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Mięśnie piersiowe | opis jakościowy |
| `fx-rear-hook-shadow-boxing` | Rear Hook Shadow Boxing | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Mięśnie piersiowe | opis jakościowy |
| `fx-lead-uppercut-shadow-boxing` | Lead Uppercut Shadow Boxing | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Mięśnie ud i podudzi | opis jakościowy |
| `fx-rear-uppercut-shadow-boxing` | Rear Uppercut Shadow Boxing | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Mięśnie ud i podudzi | opis jakościowy |
| `fx-shadow-boxing-combination-flow` | Shadow Boxing Combination Flow | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | Zginacze i prostowniki ramion; Mięśnie ud i podudzi | opis jakościowy |
| `fx-slip-and-guard-drill` | Slip and Guard Drill | Mięśnie brzucha i stabilizatory tułowia; Mięśnie ud i podudzi | Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-teep-front-push-kick-drill` | Teep Front Push Kick Drill | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | opis jakościowy |
| `fx-low-round-kick-shadow-drill` | Low Round Kick Shadow Drill | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | opis jakościowy |
| `fx-middle-roundhouse-kick-drill` | Middle Roundhouse Kick Drill | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | opis jakościowy |
| `fx-high-roundhouse-kick-drill` | High Roundhouse Kick Drill | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | opis jakościowy |
| `fx-front-snap-kick-drill` | Front Snap Kick Drill | Mięśnie ud i podudzi | Zginacze biodra; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-side-kick-chamber-drill` | Side Kick Chamber Drill | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | opis jakościowy |
| `fx-side-kick-extension-drill` | Side Kick Extension Drill | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | opis jakościowy |
| `fx-back-kick-balance-drill` | Back Kick Balance Drill | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | opis jakościowy |
| `fx-knee-strike-shadow-drill` | Knee Strike Shadow Drill | Mięśnie ud i podudzi; Mięśnie brzucha i stabilizatory tułowia | Mięśnie pośladkowe; Zginacze biodra | opis jakościowy |
| `fx-kick-check-balance-drill` | Kick Check Balance Drill | Mięśnie ud i podudzi; Mięśnie brzucha i stabilizatory tułowia | Mięśnie pośladkowe; Mięśnie łydki | opis jakościowy |
| `fx-hip-mobility-for-kicks` | Hip Mobility for Kicks | Mięśnie pośladkowe; Mięśnie ud i podudzi | Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-ankle-mobility-for-footwork` | Ankle Mobility for Footwork | Mięśnie ud i podudzi | Mięśnie łydki | opis jakościowy |
| `fx-technical-shadow-boxing-rounds` | Technical Shadow Boxing Rounds | Całe ciało | Naramienne i stabilizatory łopatki; Mięśnie ud i podudzi; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-aerobic-zone-2-cardio` | Aerobic Zone 2 Cardio | Całe ciało | Mięśnie ud i podudzi | opis jakościowy |
| `fx-tempo-running-intervals` | Tempo Running Intervals | Mięśnie ud i podudzi | Mięśnie pośladkowe; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-controlled-sprint-intervals` | Controlled Sprint Intervals | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-shadow-boxing-endurance-circuit` | Shadow Boxing Endurance Circuit | Całe ciało | Naramienne i stabilizatory łopatki; Mięśnie ud i podudzi; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-reaction-and-coordination-steps` | Reaction and Coordination Steps | Mięśnie ud i podudzi | Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-dynamic-hip-stretch` | Dynamic Hip Stretch | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-hamstring-mobility-flow` | Hamstring Mobility Flow | Mięśnie ud i podudzi | Mięśnie pośladkowe | opis jakościowy |
| `fx-shoulder-mobility-flow` | Shoulder Mobility Flow | Naramienne i stabilizatory łopatki | Mięśnie piersiowe; Mięśnie grzbietu | opis jakościowy |
| `fx-thoracic-rotation-flow` | Thoracic Rotation Flow | Mięśnie grzbietu; Mięśnie brzucha i stabilizatory tułowia | Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-ankle-dorsiflexion-mobility` | Ankle Dorsiflexion Mobility | Mięśnie ud i podudzi | Mięśnie łydki | opis jakościowy |
| `fx-hip-flexor-stretch` | Hip Flexor Stretch | Mięśnie ud i podudzi | Mięśnie brzucha i stabilizatory tułowia; Mięśnie pośladkowe | opis jakościowy |
| `fx-cat-cow-mobility` | Cat Cow Mobility | Mięśnie grzbietu; Mięśnie brzucha i stabilizatory tułowia | Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-child-s-pose-breathing` | Child's Pose Breathing | Mięśnie grzbietu | Naramienne i stabilizatory łopatki; Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-downward-dog-pose` | Downward Dog Pose | Naramienne i stabilizatory łopatki; Mięśnie ud i podudzi | Mięśnie grzbietu | opis jakościowy |
| `fx-warrior-ii-pose` | Warrior II Pose | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-tree-pose` | Tree Pose | Mięśnie ud i podudzi; Mięśnie pośladkowe | Mięśnie brzucha i stabilizatory tułowia | opis jakościowy |
| `fx-boat-pose` | Boat Pose | Mięśnie brzucha i stabilizatory tułowia; Zginacze biodra | Mięśnie grzbietu | opis jakościowy |
| `fx-cobra-pose` | Cobra Pose | Mięśnie grzbietu | Mięśnie pośladkowe; Naramienne i stabilizatory łopatki | opis jakościowy |
| `fx-bridge-pose` | Bridge Pose | Mięśnie pośladkowe; Mięśnie grzbietu | Mięśnie ud i podudzi | opis jakościowy |

## Aliasowanie duplikatów

- `glutes-odwodzenie-nogi` → `legs-odwodzenie-biodra`
- `abs-side-plank` → `abs-deska-boczna`
- `arms-uginanie-ramion-chwytem-m-otkowym` → `forearms-uginanie-m-otkowe`
- `arms-uginanie-ramion-nachwytem` → `forearms-uginanie-nachwytem`
- `kb-suitcase-carry` → `abs-spacer-z-obciazeniem-po-jednej-stronie`
- `kb-farmer-carry` → `forearms-spacer-farmera`

Profile, opisy i przypisania należy zmieniać w jednej definicji danych; sekcje korzystają ze wspólnego rejestru.
