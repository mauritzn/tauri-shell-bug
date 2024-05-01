// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use regex::Regex;
use std::process::Command;
use tauri::Manager;

#[tauri::command]
async fn print_py_numbers(python_script_path: String) -> Result<String, String> {
    let regex = Regex::new(r"\S+__print_numbers[.]py$").expect("Invalid regex pattern");

    /*
     * This regex is used to offer similar argument safety as the `tauri.conf.json` validator: { "validator": "\\S+__print_numbers[.]py$" },
     * this could obviously be avoided if the script path was handled in Rust as well,
     * but I wanted to keep this as similar as possible to the JS `Command` version.
     */
    if regex.is_match(&python_script_path) == false {
        return Err(format!(
            "Provided Python script path does not match expected filename! Got: {}",
            python_script_path
        ));
    }

    let output = Command::new("python")
        .arg(python_script_path)
        .output() // Executes the command and captures the output
        .map_err(|err| err.to_string())?;

    if output.status.success() {
        // If the command was successful, print the output
        let output_str = String::from_utf8_lossy(&output.stdout);
        Ok(output_str.to_string())
    } else {
        // If the command failed, handle the error
        let error_message = String::from_utf8_lossy(&output.stderr);
        Err(format!("Error: {}", error_message))
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![print_py_numbers])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
