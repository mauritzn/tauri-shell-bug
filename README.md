# tauri-shell-bug

> A small repo meant to show the bug in Tauri's shell Command.

## The issue

When running a command using Tauri's shell [Command](https://tauri.app/v1/api/js/shell#command) that returns a lot of data some lines get skipped in stdout and the process seems to keep running indefinitely in the background, preventing future Commands and also sometimes preventing the app from refreshing properly. From my testing around 20,000+ lines in stdout causes the problem appear.

I have an Electron application I'm trying to remake in Tauri, but it relies on a CLI application that can sometimes spew out 100,000+ lines of data, causing Tauri's [Command](https://tauri.app/v1/api/js/shell#command) to freak out.

This issue appears both while using events and `execute()`, I had hoped that using events would bypass this issue but found that the same issue occurs, leaving me to suspect a core issue in the way [Command](https://tauri.app/v1/api/js/shell#command) handles large outputs.

## Crash demo

[https://www.youtube.com/watch?v=5XgFhfV7Luw](https://www.youtube.com/watch?v=5XgFhfV7Luw)

## This repo

This repo was made as a minimal reproduction of this bug. It includes a Python script _(`__print_numbers.py`)_ which prints numbers until 250,000 numbers have been printed, it starts by printing `started` and ends by printing `done`.

The amount of numbers the Python script prints can be changed in the script, usually 20,000 is enough for the bug to appear, but I made the default 250,000 since it was still bearable and should be more than enough for the bug to appear.

I recommend running it using `npm run tauri dev`, this is mainly due to the automatic finding of the Python file, since it looks for it at the current execution path _(feel free to change this)_. Running it as a built binary also works, but make sure that the `__print_numbers.py` file is in the same directory.

> I haven't tried running this on anything other than Windows 11.
