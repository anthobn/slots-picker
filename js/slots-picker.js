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
    month.innerHTML = this.fromDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    //push all available slots in slots array
    this.pushAvSlotsInSlotsArray(this.availableSlots);

    //browse each days and check if slots are available for this day.
    this.dates.forEach((day) => {
      let date = new Date(Number(day));
      let slotsToday = [];
      let el;

      if ((el = this.slots.find((o) => Number(o.date) === day))) {
        slotsToday = el.slots;
      } else {
        //if the getSlots function is defined, get the slots from the backend with custom getSlots given function
        if (typeof this.getSlots === "function") {
          let getSlots = this.getSlots(date);

          //push the new slots received in slots array
          this.pushAvSlotsInSlotsArray(getSlots);

          if ((el = this.slots.find((o) => Number(o.date) === day))) {
            slotsToday = el.slots;
          }
        }
      }

      let col = this.makeCol(date, slotsToday);
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
      let el = this.slots.find((o) => Number(o.date) === day);

      //if there is no slots defined or if the array of slots is empty
      if (!el || !el.slots.length) {
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
        new Date(this.nextAvailableSlot).toLocaleString("default", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      );
      a.appendChild(dateTxt);
      a.href = "#";
      a.title = this.msg.notAvailableSlots.title;
      a.id = this.nextAvailableSlot;
      a.addEventListener("click", function (event) {
        inst.goToNextAvailability(event);
      });

      emptyAlertDiv.appendChild(a);
    }

    return emptyAlertDiv;
  }

  //this function will return X days (depending showXdays property) in an array from the fromDate property
  getDates() {
    let dates = [];

    for (let i = 0; i < this.showXdays; i++) {
      let date = new Date(
        new Date(this.fromDate).setDate(this.fromDate.getDate() + i)
      ).setHours(0, 0, 0, 0);
      dates.push(date);
    }

    return dates;
  }

  //push available slots in slots array and nextAvailableSlot if is defined
  pushAvSlotsInSlotsArray(avSlots) {
    if (avSlots) {
      if (avSlots["slots"]) {
        for (const [key, value] of Object.entries(avSlots["slots"])) {
          const el = { date: key, slots: value };
          this.slots.push(el);
        }
      }
      if (avSlots["nextAvailableSlot"]) {
        this.nextAvailableSlot = avSlots["nextAvailableSlot"];
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
        //DT
        let hour = slot.split(":");
        let slotDT = date.setHours(hour[0], hour[1]);

        //create clickable slot
        let a = document.createElement("a");
        let text = document.createTextNode(slot);
        a.appendChild(text);
        a.href = "#";
        a.title = inst.msg.slots.title;
        a.id = slotDT;
        a.addEventListener("click", function (event) {
          inst.slotSelected(event);
        });

        //if this slot is selected, mark active class
        if (inst.selectedSlots.includes(slotDT)) {
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
    if (this.selectedSlots.includes(slotDT.getTime())) {
      eventSlot.isNewSelect = false;
      event.target.removeAttribute("class");

      //remove selected slot from the selectedSlots array
      let index = this.selectedSlots.indexOf(slotDT.getTime());
      if (index !== -1) {
        this.selectedSlots.splice(index, 1);
      }
    } else {
      //if there is not possible multipleSelector, remove old slot selection
      if (!this.multipleSelector && this.selectedSlots.length) {
        let slot = document.getElementById(this.selectedSlots[0]);

        //if the slot is in the document (the slot can be disappear when the user navigate with the arrows)
        if (slot) {
          slot.removeAttribute("class");
        }

        this.selectedSlots = [];
      }

      //push the slot and mark as active
      this.selectedSlots.push(slotDT.getTime());
      event.target.setAttribute("class", "active");
    }

    //if custom slotsOnClick function given, send event to slotsOnClick custom function
    if (typeof this.slotsOnClick === "function") {
      this.slotsOnClick(eventSlot, this.selectedSlots);
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
    this.fromDate = new Date(
      new Date(this.fromDate).setDate(this.fromDate.getDate() - this.showXdays)
    );
    this.init();
  }

  //event onclick on the next nav arrow
  next(event, date = null) {
    if (date) {
      this.fromDate = date;
    } else {
      let lastDate = new Date(this.dates[this.dates.length - 1]);
      //add one day to last day
      this.fromDate = new Date(lastDate.setDate(lastDate.getDate() + 1));
    }
    this.init();
  }
}
