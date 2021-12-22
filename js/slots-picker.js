/*!
 * Author:  Anthony BARNOIN
 * Name:    Slots Picker v0.0.1
 * License: MIT License
 */

export class slotsPicker {
  default = {
    slotsPickerEl: "slots-picker",
    availableSlots: null,
    nextAvailableSlot: null,
    slots: [],
    selectedSlots: [],
    multipleSelector: false,
    fromDate: new Date(),
    showXdays: 7,
    dates: [],
    slotsOnClick: null,
    getSlots: null,
    msg: {
      notAvailableSlots: {
        p: "No slots available",
        title: "Click here to check availability ",
      },
      slots: {
        title: "Click here to book this slot",
      },
    },
  };

  constructor(settings) {
    //add X days to one DT object
    Date.prototype.addDays = function (days) {
      let date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };

    //apply personnal settings in property of this object unless personnal settings is not defined
    for (const [key, value] of Object.entries(this.default)) {
      if (settings && Object.hasOwnProperty.call(settings, key)) {
        this[key] = settings[key];
      } else {
        this[key] = value;
      }
    }
  }

  init() {
    const inst = this;

    let slotsPicker = document.getElementById(this.slotsPickerEl);
    slotsPicker.innerHTML = this.makeSkeleton();

    let slotsContainer = document.getElementById("slots-container");

    //add event listener to nav arrows
    let arrowPrevious = document.getElementById("arrow-previous");
    let arrowNext = document.getElementById("arrow-next");
    arrowPrevious.addEventListener("click", function (event) {
      inst.previous(event);
    });
    arrowNext.addEventListener("click", function (event) {
      inst.next(event);
    });

    //get the x next dates from the fromDate depending showXdays
    this.dates = this.getDates();

    //add the month name and year on the top
    let month = document.getElementById("month-name");
    month.innerHTML = this.fromDate.toLocaleDateString("default", {
      month: "long",
      year: "numeric",
    });

    //if there is no already slots filled
    if (!this.slots.length) {
      //push all available slots in slots array
      this.pushAvSlotsInSlotsArray(this.availableSlots);
    }

    //browse each days and check if slots are available for this day.
    this.dates.forEach((day) => {
      const endDay = new Date(new Date(day).setHours(23, 59, 59, 59));

      //get all slots for this day
      const slotsToday = this.slots.filter((o) => o >= day && o <= endDay);

      let col = this.makeCol(day, slotsToday);
      slotsContainer.appendChild(col);
    });

    if (this.allSlotsEmpty()) {
      let alertBox = this.createAlertBox();
      slotsContainer.appendChild(alertBox);
    }
  }

  makeSkeleton() {
    return `
    <div class="month-container">
      <div class="nav-arrow" id="arrow-previous">&#60;</div>
      <p id="month-name"></p>
      <div class="nav-arrow" id="arrow-next">&#62;</div>
    </div>
    <div class="slots-container" id="slots-container"></div>
    `;
  }

  allSlotsEmpty() {
    let emptyArray = 0;

    this.dates.forEach((day) => {
      const endDay = new Date(new Date(day).setHours(23, 59, 59, 59));

      //get all slots for this day
      let el = this.slots.filter((o) => o >= day && o <= endDay);

      //if there is no slots defined or if the array of slots is empty
      if (!el || !el.length) {
        emptyArray++;
      }
    });

    if (emptyArray === this.dates.length) {
      return true;
    }
    return false;
  }

  //this function create the alert box about empty slots
  createAlertBox() {
    const inst = this;

    //create div
    let emptyAlertDiv = document.createElement("div");
    emptyAlertDiv.className = "not-available-alert";

    //create msg
    let p = document.createElement("p");
    let msg = document.createTextNode(this.msg.notAvailableSlots.p);
    p.appendChild(msg);

    //append to div
    emptyAlertDiv.appendChild(p);

    //if nextAvailableSlot is defined, show link in alertBox to directly go to the available date
    if (this.nextAvailableSlot) {
      //create link
      let a = document.createElement("a");
      let dateTxt = document.createTextNode(
        new Date(this.nextAvailableSlot).toLocaleDateString("default", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      );
      a.appendChild(dateTxt);
      a.href = "#";
      a.title = this.msg.notAvailableSlots.title;
      a.id = this.nextAvailableSlot.getTime();
      a.addEventListener("click", function (event) {
        inst.goToNextAvailability(event);
      });

      emptyAlertDiv.appendChild(a);
    }

    return emptyAlertDiv;
  }

  //this function will return X days (depending showXdays property) in an array from the fromDate property
  getDates() {
    //update fromDate to 00:00 local time
    this.fromDate = new Date(this.fromDate.setHours(0, 0, 0, 0));

    let dates = [];

    for (let i = 0; i < this.showXdays; i++) {
      const date = new Date(this.fromDate).addDays(i);
      dates.push(date);
    }

    return dates;
  }

  //push available slots in slots array and nextAvailableSlot if is defined
  pushAvSlotsInSlotsArray(avSlots) {
    if (avSlots) {
      this.slots = [];
      if (avSlots["slots"]) {
        avSlots["slots"].forEach((slot) => {
          this.slots.push(new Date(slot.begin));
        });
      }
      if (avSlots["nextAvailableSlot"]) {
        this.nextAvailableSlot = new Date(avSlots["nextAvailableSlot"]);
      }
    }
  }

  makeCol(date, slots) {
    const inst = this;

    //function for create thead
    function makeThead() {
      let theadDiv = document.createElement("div");
      theadDiv.className = "thead";

      let dateNumber = document.createTextNode(date.getDate());
      let dayName = document.createTextNode(
        date.toLocaleString("default", { weekday: "long" })
      );
      let p1 = document.createElement("p");
      let p2 = document.createElement("p");
      p1.appendChild(dateNumber);
      p2.appendChild(dayName);
      theadDiv.appendChild(p1);
      theadDiv.appendChild(p2);

      return theadDiv;
    }

    //function for browse all slots and create slot div
    function makeSlots() {
      let slotsDiv = document.createElement("div");
      slotsDiv.className = "slots";

      slots.forEach((slot) => {
        let displayHour = slot.toLocaleTimeString("default", {
          hour: "2-digit",
          minute: "2-digit",
        });

        //create clickable slot
        let a = document.createElement("a");
        let text = document.createTextNode(displayHour);
        a.appendChild(text);
        a.href = "#";
        a.title = inst.msg.slots.title;
        a.id = slot.getTime();
        a.addEventListener("click", function (event) {
          inst.slotSelected(event);
        });

        //if this slot is selected, mark active class
        if (inst.selectedSlots.some((o) => o === slot.toISOString())) {
          a.className = "active";
        }

        slotsDiv.appendChild(a);
      });

      return slotsDiv;
    }

    let theadDiv = makeThead();
    let slotsDiv = makeSlots();

    //create col
    let col = document.createElement("div");
    col.className = "col";
    col.appendChild(theadDiv);
    col.appendChild(slotsDiv);

    return col;
  }

  //event onclick to one slot
  slotSelected(event) {
    event.preventDefault();
    let slotDT = new Date(Number(event.target.getAttribute("id")));
    let eventSlot = { date: slotDT, isNewSelect: true };

    //if slot have already selected by user, user request to unselect the slot
    if (this.selectedSlots.includes(slotDT.toISOString())) {
      eventSlot.isNewSelect = false;
      event.target.removeAttribute("class");

      //remove selected slot from the selectedSlots array
      let index = this.selectedSlots.indexOf(slotDT.toISOString());
      if (index !== -1) {
        this.selectedSlots.splice(index, 1);
      }
    } else {
      //if there is not possible multipleSelector, remove old slot selection
      if (!this.multipleSelector && this.selectedSlots.length) {
        let slot = document.getElementById(
          new Date(this.selectedSlots[0]).getTime()
        );

        //if the slot is in the document (the slot can be disappear when the user navigate with the arrows)
        if (slot) {
          slot.removeAttribute("class");
        }

        this.selectedSlots = [];
      }

      //push the slot and mark as active
      this.selectedSlots.push(slotDT.toISOString());
      event.target.setAttribute("class", "active");
    }

    //if custom slotsOnClick function given, send event to slotsOnClick custom function
    if (typeof this.slotsOnClick === "function") {
      this.slotsOnClick(eventSlot, this.selectedSlots);
    }
  }

  callNewDatas(date) {
    //if the getSlots function is defined, get the slots from the backend with custom getSlots given function
    if (typeof this.getSlots === "function") {
      const getSlots = this.getSlots(date);

      //push the new slots received in slots array
      this.pushAvSlotsInSlotsArray(getSlots);
    }
  }

  //event onlick in alertBox
  goToNextAvailability(event) {
    event.preventDefault();
    let date = new Date(Number(event.target.getAttribute("id")));
    this.next(null, date);
  }

  //event onclick on the previous nav arrow
  previous() {
    this.fromDate = this.fromDate.addDays(-this.showXdays);
    this.callNewDatas(this.fromDate);
    this.init();
  }

  //event onclick on the next nav arrow
  next(event, date = null) {
    if (date) {
      this.fromDate = date;
    } else {
      const lastDate = this.dates[this.dates.length - 1];
      //add one day to last day
      this.fromDate = lastDate.addDays(1);
    }
    this.callNewDatas(this.fromDate);
    this.init();
  }
}
