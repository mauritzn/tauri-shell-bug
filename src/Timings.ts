/**
 * @file This Class makes it easier to run performance testing
 * @author Mauritz Nilsson - https://github.com/mauritzn
 * @license MIT
 * @version 0.0.1
 *
 * I got tired of creating a bunch of timing variables so instead I created a class for handling it all.
 * A lot of things could probably be improved, but the basics work.
 */

export class Timings<ID extends string> {
  private _data: { id: ID; start: number; end: number }[] = [];

  constructor(...ids: ID[]) {
    for (const id of ids) {
      this._data.push({
        id: id,
        start: 0,
        end: 0,
      });
    }
  }

  private formatTime(
    milliseconds: number,
    useFullUnitNames: boolean = false
  ): string {
    // Constants for conversions
    const MS_TO_SECONDS = 1000;
    const MS_TO_MINUTES = 60 * MS_TO_SECONDS;
    const MS_TO_HOURS = 60 * MS_TO_MINUTES;

    let value: number;
    let unit: string;

    // Determine the most appropriate unit and convert
    if (milliseconds >= MS_TO_HOURS) {
      value = milliseconds / MS_TO_HOURS;
      unit = useFullUnitNames ? "hour" : "h";
    } else if (milliseconds >= MS_TO_MINUTES) {
      value = milliseconds / MS_TO_MINUTES;
      unit = useFullUnitNames ? "minute" : "m";
    } else if (milliseconds >= MS_TO_SECONDS) {
      value = milliseconds / MS_TO_SECONDS;
      unit = useFullUnitNames ? "second" : "s";
    } else if (milliseconds >= 1) {
      value = milliseconds;
      unit = useFullUnitNames ? "millisecond" : "ms";
    } else if (milliseconds >= 0.001) {
      value = milliseconds * 1000;
      unit = useFullUnitNames ? "microsecond" : "μs";
    } else {
      value = milliseconds * 1_000_000;
      unit = useFullUnitNames ? "nanosecond" : "ns";
    }

    // Format number to 2 decimal places and trim unnecessary zeros
    let result = value.toFixed(2);
    // Remove trailing zeros
    result = result.replace(/(\.\d*[0-9])0+$/, "$1");
    // Remove trailing decimal point if it ends with ".0"
    result = result.replace(/\.0$/, "");

    // since performance.now() isn't quite precise enough append a "~" to result
    if (["μs", "ns", "microsecond", "nanosecond"].includes(unit)) {
      result = `~${result}`;
    }

    // append "s" for signifying it's more than 1, however "1" with decimals does get "s" appended to it as well
    if (useFullUnitNames === true) {
      const flooredValue = Math.floor(value);
      if (flooredValue !== 1 || (flooredValue === 1 && result.includes("."))) {
        unit = `${unit}s`;
      }
    }

    return `${result} ${unit}`;
  }

  private idToPropertyName(id: ID): string {
    // Trim whitespace, replace spaces with underscores, and replace non-alphanumeric characters with a hyphen
    const cleanId = id
      .trim()
      .replace(/\s+/g, "_") // Replace spaces and other whitespace with underscores
      .replace(/[^A-Z0-9_]/gi, "-"); // Replace non-alphanumeric characters with a hyphen

    return `RESULT__${cleanId}`;
  }

  private getIndex(id: ID): number {
    return this._data.findIndex((data) => data.id === id);
  }

  public getData(id: ID): { id: ID; start: number; end: number } | null {
    const index = this.getIndex(id);
    return index >= 0 ? this._data[index] : null;
  }

  public getResult(id: ID, useFullUnitNames: boolean = false): string {
    const data = this.getData(id);
    if (data === null) {
      console.warn(
        `Cannot get result for timing with ID: ${id}, it does not seem to exist!`
      );
      return `INVALID_ID ms`;
      //this._data[index].start = performance.now();
    }

    if (data.start <= 0) {
      console.warn(
        `Cannot get result for timing with ID: ${data.id}, it has not be started!`
      );
      return `NOT_STARTED ms`;
    }
    if (data.end <= 0) {
      console.warn(
        `Cannot get result for timing with ID: ${data.id}, it has not be ended!`
      );
      return `NOT_ENDED ms`;
    }

    return this.formatTime(data.end - data.start, useFullUnitNames);
  }

  public getResults(useFullUnitNames: boolean = false): object {
    const results: any = {};

    for (const data of this._data) {
      if (data.start <= 0) {
        console.warn(
          `Cannot get result for timing with ID: ${data.id}, it has not be started!`
        );
        continue;
      }
      if (data.end <= 0) {
        console.warn(
          `Cannot get result for timing with ID: ${data.id}, it has not be ended!`
        );
        continue;
      }
      results[this.idToPropertyName(data.id)] = this.formatTime(
        data.end - data.start,
        useFullUnitNames
      );
    }

    return results;
  }

  public start(...ids: ID[]) {
    const perfNow = performance.now();
    for (const id of ids) {
      const index = this.getIndex(id);
      if (index >= 0) {
        this._data[index].start = perfNow;
      }
    }
  }

  public startAll() {
    const perfNow = performance.now();
    this._data = this._data.map((data) => {
      data.start = perfNow;
      return data;
    });
  }

  public end(...ids: ID[]) {
    const perfNow = performance.now();
    for (const id of ids) {
      const index = this.getIndex(id);
      if (index >= 0) {
        this._data[index].end = perfNow;
      }
    }
  }

  public endAll() {
    const perfNow = performance.now();
    this._data = this._data.map((data) => {
      data.end = perfNow;
      return data;
    });
  }

  public reset(...ids: ID[]) {
    for (const id of ids) {
      const index = this.getIndex(id);
      if (index >= 0) {
        this._data[index].start = 0;
        this._data[index].end = 0;
      }
    }
  }

  public resetAll() {
    this._data = this._data.map((data) => {
      data.start = 0;
      data.end = 0;
      return data;
    });
  }
}
