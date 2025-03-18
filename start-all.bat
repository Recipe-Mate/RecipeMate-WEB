@echo on
echo [Step 1] Starting Spring Boot Server...
start cmd /k "cd app_server && gradlew.bat bootRun"

echo [Step 2] Waiting for server to initialize...
timeout /t 10 /nobreak >nul

echo [Step 3] Starting Metro bundler...
start cmd /k "cd app_front && npx react-native start"

echo [Step 4] Waiting for Metro to initialize...
timeout /t 5 /nobreak >nul

echo [Step 5] Starting Android app...
start cmd /k "cd app_front && npx react-native run-android"

echo All processes started! Check the other terminal windows for progress.
pause
