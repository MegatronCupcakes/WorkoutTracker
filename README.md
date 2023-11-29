# WorkoutTracker
Aging is rough. As I get older and as more aspects of life compete for my time and attention, it's harder and harder to maintain my fitness. While I’m no professional athlete and certainly not a bodybuilder, I do regularly lift weights to maintain muscle mass and bone density. I currently track my workouts using a spreadsheet. While this enables me to measure progress, it is not exactly convenient.  Enter the WorkoutTracker.

WorkoutTracker is a Progressive Web Application (PWA) built with C# (with Blazor Webassembly) and JavaScript.  A PWA allows for the convenience of a mobile or desktop application (I plan to use WorkoutTracker on my iPhone) without the hassle of lengthy and tedious App Store approvals.  WorkoutTracker is designed to be completely self-contained and offline-capable; it uses IndexedDb for data persistence, leveraging a custom JavaScript interface mimicing MongoDb's query and update interfaces.
### Code:You Capstone Project Features
1. Generic Class for IndexedDb integration; stores and retrieves data for multiple Types
2. Asynchronicity
3. Multiple inter-related entitites
### Running WorkoutTracker
just visit [WorkoutTracker on the web](https://megatroncupcakes.ddns.net:9009/).

<img src="WorkoutTracker/wwwroot/screenshots/1-Chrome.png" height="200">
<img src="WorkoutTracker/wwwroot/screenshots/2-Chrome.png" height="200">
<img src="WorkoutTracker/wwwroot/screenshots/3-Safari.png" height="200">
<img src="WorkoutTracker/wwwroot/screenshots/4-Safari.png" height="200">
<img src="WorkoutTracker/wwwroot/screenshots/5.png" height="200">
<img src="WorkoutTracker/wwwroot/screenshots/6-Desktop.png" height="200">

Or if you'd prefer, you can clone the repo and run it yourself with VisualStudio or VSCode.
```
git clone https://github.com/MegatronCupcakes/WorkoutTracker.git
```

OR if your're feeling adventurous and want to host your own instance, you can build your own Docker image:
```
git clone https://github.com/MegatronCupcakes/WorkoutTracker.git
cd ./WorkoutTracker/WorkoutTracker
docker build -t megatroncupcakes/workout-tracker:latest .
```
