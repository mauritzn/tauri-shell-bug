import { Command } from "@tauri-apps/api/shell";
import { exists } from "@tauri-apps/api/fs";
import { join, resolve, dirname } from "@tauri-apps/api/path";

async function findPythonScript(): Promise<string> {
  let currentFolder = await resolve(".");
  if (currentFolder.endsWith("src-tauri")) {
    currentFolder = await dirname(currentFolder);
  }

  const pythonScript = await join(currentFolder, "__print_numbers.py");
  if ((await exists(pythonScript)) === true) {
    return pythonScript;
  } else {
    throw new Error(
      "Failed to find Python script (__print_numbers.py) in app directory!"
    );
  }
}

async function executeProcess(pythonScriptPath: string) {
  console.log("Running python script (with execute)...");

  let process = await new Command("python-test", [pythonScriptPath]).execute();

  console.log(process.stdout);
  console.log("Done...");
}

async function eventProcess(pythonScriptPath: string) {
  let process = new Command("python-test", [pythonScriptPath]);

  process.on("close", (data) => {
    console.log(
      `command finished with code ${data.code} and signal ${data.signal}`,
      data
    );
  });

  process.on("error", (error) => {
    console.error(`command error: "${error}"`);
  });

  process.stdout.on("data", (line) => {
    console.log(line);
  });

  process.stderr.on("data", (line) => {
    console.log(`command stderr: "${line}"`);
  });

  console.log("Running python script (with events)...");
  const child = await process.spawn();
  console.log("pid:", child.pid);
}

window.addEventListener("DOMContentLoaded", () => {
  findPythonScript()
    .then((pythonScriptPath) => {
      const executeFormEl = document.querySelector(
        "form#executeForm"
      ) as HTMLFormElement | null;
      const eventFormEl = document.querySelector(
        "form#eventForm"
      ) as HTMLFormElement | null;

      if (executeFormEl) {
        const executeFormButtonEl = executeFormEl.querySelector(
          "button"
        ) as HTMLButtonElement | null;
        if (executeFormButtonEl) {
          executeFormEl.addEventListener("submit", (event) => {
            event.preventDefault();

            executeFormButtonEl.innerText = "Running...";
            executeFormButtonEl.disabled = true;

            executeProcess(pythonScriptPath).finally(() => {
              executeFormButtonEl.innerText = "Start";
              executeFormButtonEl.disabled = false;
            });
          });
        } else {
          console.warn(`missing "form#executeForm button" element!`);
        }
      } else {
        console.warn(`missing "form#executeForm" element!`);
      }

      if (eventFormEl) {
        const eventFormButtonEl = eventFormEl.querySelector(
          "button"
        ) as HTMLButtonElement | null;
        if (eventFormButtonEl) {
          eventFormEl.addEventListener("submit", (event) => {
            event.preventDefault();

            eventFormButtonEl.innerText = "Running...";
            eventFormButtonEl.disabled = true;

            eventProcess(pythonScriptPath).finally(() => {
              eventFormButtonEl.innerText = "Start";
              eventFormButtonEl.disabled = false;
            });
          });
        } else {
          console.warn(`missing "form#eventFormEl button" element!`);
        }
      } else {
        console.warn(`missing "form#eventFormEl" element!`);
      }
    })
    .catch((err) => console.error(err));
});
