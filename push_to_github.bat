@echo off
echo ====================================================================
echo Pushing OptiQueue AI to GitHub (https://github.com/GauravK221b)
echo ====================================================================
echo.

git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================================
    echo [SUCCESS] Project successfully pushed to GitHub!
    echo URL: https://github.com/GauravK221b/Autonomous-Retail-Checkout-Queue-Optimizer-SimPy
    echo ====================================================================
) else (
    echo.
    echo [NOTE] If you saw "repository not found", please ensure you have created
    echo an empty public repository named "Autonomous-Retail-Checkout-Queue-Optimizer-SimPy"
    echo on https://github.com/new first, then run this script again.
)

pause
