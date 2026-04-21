@echo off
echo ====================================
echo Milk Management - Seed Data Loader
echo ====================================
echo.

REM Ask for MySQL password
set /p MYSQL_PASSWORD="Enter MySQL root password: "

echo.
echo Loading seed data into milk_management_db...
echo.

REM Load seed data
mysql -u root -p%MYSQL_PASSWORD% milk_management_db < seed_data.sql

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo Seed data loaded successfully!
    echo ====================================
) else (
    echo.
    echo ====================================
    echo ERROR: Failed to load seed data
    echo ====================================
    echo.
    echo Common issues:
    echo 1. MySQL is not running
    echo 2. Database 'milk_management_db' doesn't exist
    echo 3. Wrong password
    echo 4. MySQL not in PATH (try adding C:\Program Files\MySQL\MySQL Server X.X\bin to PATH)
)

echo.
pause
