import { Command } from "@tauri-apps/api/shell";
import { exists } from "@tauri-apps/api/fs";
import { join, resolve, dirname } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api";

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

async function invokeProcess(pythonScriptPath: string) {
  console.log("Running python script (with invoke workaround)...");

  try {
    const output = await invoke("print_py_numbers", { pythonScriptPath });
    console.log(output);
    console.log("Done...");
  } catch (err) {
    console.error(`command error: "${err}"`);
  }
}

async function executeProcess(pythonScriptPath: string) {
  console.log("Running python script (with JS Command execute)...");

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

  console.log("Running python script (with JS Command events)...");
  const child = await process.spawn();
  console.log("pid:", child.pid);
}

window.addEventListener("DOMContentLoaded", () => {
  findPythonScript()
    .then((pythonScriptPath) => {
      const invokeWorkaroundFormEl = document.querySelector(
        "form#invokeWorkaroundForm"
      ) as HTMLFormElement | null;
      const executeFormEl = document.querySelector(
        "form#executeForm"
      ) as HTMLFormElement | null;
      const eventFormEl = document.querySelector(
        "form#eventForm"
      ) as HTMLFormElement | null;

      if (invokeWorkaroundFormEl) {
        const submitBtnEl = invokeWorkaroundFormEl.querySelector(
          "button"
        ) as HTMLButtonElement | null;
        if (submitBtnEl) {
          invokeWorkaroundFormEl.addEventListener("submit", (event) => {
            event.preventDefault();

            submitBtnEl.innerText = "Running...";
            submitBtnEl.disabled = true;

            invokeProcess(pythonScriptPath).finally(() => {
              submitBtnEl.innerText = "Start";
              submitBtnEl.disabled = false;
            });
          });
        } else {
          console.warn(`missing "form#executeForm button" element!`);
        }
      } else {
        console.warn(`missing "form#invokeWorkaroundForm" element!`);
      }

      if (executeFormEl) {
        const submitBtnEl = executeFormEl.querySelector(
          "button"
        ) as HTMLButtonElement | null;
        if (submitBtnEl) {
          executeFormEl.addEventListener("submit", (event) => {
            event.preventDefault();

            submitBtnEl.innerText = "Running...";
            submitBtnEl.disabled = true;

            executeProcess(pythonScriptPath).finally(() => {
              submitBtnEl.innerText = "Start";
              submitBtnEl.disabled = false;
            });
          });
        } else {
          console.warn(`missing "form#executeForm button" element!`);
        }
      } else {
        console.warn(`missing "form#executeForm" element!`);
      }

      if (eventFormEl) {
        const submitBtnEl = eventFormEl.querySelector(
          "button"
        ) as HTMLButtonElement | null;
        if (submitBtnEl) {
          eventFormEl.addEventListener("submit", (event) => {
            event.preventDefault();

            submitBtnEl.innerText = "Running...";
            submitBtnEl.disabled = true;

            eventProcess(pythonScriptPath).finally(() => {
              submitBtnEl.innerText = "Start";
              submitBtnEl.disabled = false;
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
