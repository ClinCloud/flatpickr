import { Plugin } from "../../types/options";
import { DayElement as MonthElement, Instance } from "../../types/instance";
import { monthToStr } from "../../utils/formatting";

export interface Config {
  shorthand: boolean;
  dateFormat: string;
  altFormat: string;
  theme: string;
}

export interface ElementDate extends Element {
  dateObj: Date;
}

// export type MonthElement = HTMLSpanElement & { dateObj: Date; $i: number };

const defaultConfig: Config = {
  shorthand: false,
  dateFormat: "F Y",
  altFormat: "F Y",
  theme: "light",
};

function monthSelectPlugin(pluginConfig?: Partial<Config>): Plugin {
  const config = { ...defaultConfig, ...pluginConfig };

  return (fp: Instance) => {
    fp.config.dateFormat = config.dateFormat;
    fp.config.altFormat = config.altFormat;
    const self = { monthsContainer: null as null | HTMLDivElement };

    function clearUnnecessaryDOMElements(): void {
      if (!fp.rContainer || !fp.daysContainer || !fp.weekdayContainer) return;

      fp.rContainer.removeChild(fp.daysContainer);
      fp.rContainer.removeChild(fp.weekdayContainer);

      for (let index = 0; index < fp.monthElements.length; index++) {
        const element = fp.monthElements[index];
        if (!element.parentNode) continue;

        element.parentNode.removeChild(element);
      }
    }

    function addListeners() {
      fp._bind(fp.prevMonthNav, "click", () => {
        fp.currentYear -= 1;
        selectYear();
      });

      fp._bind(fp.nextMonthNav, "mousedown", () => {
        fp.currentYear += 1;
        selectYear();
      });
    }

    function addMonths() {
      if (!fp.rContainer) return;

      self.monthsContainer = fp._createElement<HTMLDivElement>(
        "div",
        "flatpickr-monthSelect-months"
      );

      self.monthsContainer.tabIndex = -1;

      fp.calendarContainer.classList.add(
        `flatpickr-monthSelect-theme-${config.theme}`
      );

      for (let i = 0; i < 12; i++) {
        const month = fp._createElement<MonthElement>(
          "span",
          "flatpickr-monthSelect-month"
        );
        month.dateObj = new Date(fp.currentYear, i);
        month.$i = i;
        month.textContent = monthToStr(i, config.shorthand, fp.l10n);
        month.tabIndex = -1;
        month.addEventListener("click", selectMonth);
        self.monthsContainer.appendChild(month);
        if ((fp.config.minDate && month.dateObj < fp.config.minDate) || (fp.config.maxDate && month.dateObj > fp.config.maxDate)) {
          month.classList.add("disabled");
        }
      }

      fp.rContainer.appendChild(self.monthsContainer);
    }

    function setCurrentlySelected() {
      if (!fp.rContainer) return;

      const currentlySelected = fp.rContainer.querySelectorAll(
        ".flatpickr-monthSelect-month.selected"
      );

      for (let index = 0; index < currentlySelected.length; index++) {
        currentlySelected[index].classList.remove("selected");
      }

      const month = fp.rContainer.querySelector(
        `.flatpickr-monthSelect-month:nth-child(${fp.currentMonth + 1})`
      );

      if (month) {
        month.classList.add("selected");
      }
    }

    function selectYear() {
      let selectedDate = fp.selectedDates[0];
      if (selectedDate) {
        selectedDate = new Date(selectedDate);
        selectedDate.setFullYear(fp.currentYear);
        if (fp.config.minDate && selectedDate < fp.config.minDate) {
          selectedDate = fp.config.minDate;
        }
        if (fp.config.maxDate && selectedDate > fp.config.maxDate) {
          selectedDate = fp.config.maxDate;
        }
        fp.currentYear = selectedDate.getFullYear();
        fp.currentYearElement.value = String(fp.currentYear);
        setCurrentlySelected();
      }
      if (fp.rContainer) {
        const months: NodeListOf<ElementDate> = fp.rContainer.querySelectorAll(".flatpickr-monthSelect-month");
        months.forEach(month => {
          month.dateObj.setFullYear(fp.currentYear);
          if ((fp.config.minDate && month.dateObj < fp.config.minDate) || (fp.config.maxDate && month.dateObj > fp.config.maxDate)) {
            month.classList.add("disabled");
          } else {
            month.classList.remove("disabled");
          }
        });
      }
      
    }

    function selectMonth(e: Event) {
      e.preventDefault();
      e.stopPropagation();
      if (e.target instanceof Element && !e.target.classList.contains("disabled")) {
        setMonth((e.target as MonthElement).dateObj);
        fp.close();
      }
    }

    function setMonth(date: Date) {
      const selectedDate = new Date(date);
      selectedDate.setFullYear(fp.currentYear);
      fp.currentMonth = selectedDate.getMonth();

      fp.setDate(selectedDate, true);

      setCurrentlySelected();
    }

    const shifts: Record<number, number> = {
      37: -1,
      39: 1,
      40: 3,
      38: -3,
    };

    function onKeyDown(_: any, __: any, ___: any, e: KeyboardEvent) {
      const shouldMove = shifts[e.keyCode] !== undefined;
      if (!shouldMove && e.keyCode !== 13) {
        return;
      }

      if (!fp.rContainer || !self.monthsContainer) return;

      const currentlySelected = fp.rContainer.querySelector(
        ".flatpickr-monthSelect-month.selected"
      ) as HTMLElement;

      let index = Array.prototype.indexOf.call(
        self.monthsContainer.children,
        document.activeElement
      );

      if (index === -1) {
        const target =
          currentlySelected || self.monthsContainer.firstElementChild;
        target.focus();
        index = (target as MonthElement).$i;
      }

      if (shouldMove) {
        (self.monthsContainer.children[
          (12 + index + shifts[e.keyCode]) % 12
        ] as HTMLElement).focus();
      } else if (
        e.keyCode === 13 &&
        self.monthsContainer.contains(document.activeElement)
      ) {
        setMonth((document.activeElement as MonthElement).dateObj);
      }
    }

    function destroyPluginInstance() {
      if (self.monthsContainer !== null) {
        const months = self.monthsContainer.querySelectorAll(
          ".flatpickr-monthSelect-month"
        );

        for (let index = 0; index < months.length; index++) {
          months[index].removeEventListener("click", selectMonth);
        }
      }
    }

    return {
      onParseConfig() {
        fp.config.mode = "single";
        fp.config.enableTime = false;
      },
      onValueUpdate: setCurrentlySelected,
      onKeyDown,
      onReady: [
        clearUnnecessaryDOMElements,
        addListeners,
        addMonths,
        setCurrentlySelected,
        () => {
          fp.loadedPlugins.push("monthSelect");
        },
      ],
      onDestroy: destroyPluginInstance,
    };
  };
}

export default monthSelectPlugin;
