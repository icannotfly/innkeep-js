//
// innkeep.js
// buy and sell apples
// 
var version = "0.0.0-alpha.28";
var versionString = "innkeep v" + version;
console.info(versionString);
$(".game-version").html(versionString);





//
// utility functions
//

// pad the given input
function pad(input, length, padWith)
{
    var blank = "";
    for (var i=0; i<length; i++)
    {
        blank += String(padWith);
    }
    return (blank + String(input)).slice(length * -1);
}

// return ordinal indicator (-rd, -st, -nd) for the given number
function getOrdinal(number)
{
    switch (number % 10)
    {
        case 1:
            return "st";
            break;

        case 2:
            return "nd";
            break;

        case 3:
            return "rd";
            break;

        default:
            return "th";
            break;
    }
}





//
// classes
//

// item
class Item
{
    constructor(x)
    {
        this.id = x.get("id");
        this.name =
        {
            singular: x.get("nameSingular"),
            plural: x.get("namePlural")
        }
        this.description = x.get("description");
        this.price = x.get("price");
    }
}



// inventory
class Inventory extends Map
{
    constructor(elem)
    {
        super();
        this.containerElement = elem;
    }

    // adds item with given itemid to this inventory. if item already exists in this inventory, quantities will be combined. returns true if successful, false otherwise.
    add(itemid, quantity)
    {
        var func = "Inventory.add";

        if (!itemid || !quantity) {
            console.warn(func + ": must provide both itemid and quantity.");
            return false;
        }

        if (quantity < 0)
        {
            console.warn(func + ": quantity cannot be negative.");
            return false;
        }

        if (!this.get(itemid))
        {
            // doesn't exist, need to create it
            this.set(itemid, quantity);
        }
        else
        {
            // already exists, update quantity
            this.set(itemid, this.get(itemid)+quantity);
        }
        return true;
    }

    // removes quantity item with given itemid from this inventory. returns true if removal successful, false otherwise.
    remove(itemid, quantity)
    {
        var func = "Inventory.remove";

        if (!itemid || !quantity)
        {
            console.warn(func + ": must provide both itemid and quantity.");
            return false;
        }

        if (!this.get(itemid)) {
            console.warn(func + ": could not find any item with id " + itemid + " in this inventory.");
            return false;
        }
        if (quantity < 0) {
            console.warn(func + ": quantity cannot be negative.");
            return false;
        }

        if (this.get(itemid) < quantity)
        {
            // not enough
            console.warn(func + ": cannot remove. Asked to remove " + quantity + ", only have " + this.get(itemid) + ".");
            return false;
        }
        else if(this.get(itemid) == quantity)
        {
            // exactly enough, delete entry
            this.delete(itemid);
        }
        else
        {
            this.set(itemid, this.get(itemid) - quantity);
        }
        return true;
    }

    // sells quantity of itemid, returns the amount of money made from the sale, or false if some error
    sell(itemid, quantity)
    {
        var func = "Inventory.sell";

        if(!this.has(itemid))
        {
            console.warn(func + ": cannot sell an item (" + itemid + ") we don't have.");
            return false; // TODO test
        }

        var value = this.get(itemid);
        if(quantity > value)
        {
            console.warn(func + ": tried to sell " + quantity + " " + itemid + ", but only have " + value + "."); // TODO test
            return false;
        }

        this.set(itemid, this.get(itemid) - quantity);
        var profit = quantity * itemDict.get(itemid).price
        console.info("Sold " + quantity + " " + itemid + " for " + profit + "c.");
        
        return profit;
    }

    //
    updateDisplay()
    {
        var containerElement = this.containerElement;

        this.forEach(function (value, key)
        {
            var id = "inventory-row-" + key;

            if($("#"+id).length > 0)
            {
                // row already exists, so we just need to update it
                var thing = itemDict.get(key);
                containerElement.find(".qty").html(value);
                containerElement.find(".price").html(thing.price);
            }
            else
            {
                // a row for this item doesn't exist yet, let's create one
                var thing = itemDict.get(key);
                var row = 
                    "<tr id=\"" + id + "\">" +
                    "<td>" + key + "</td>" +
                    "<td>" + thing.name.singular + "</td>" +
                    "<td class=\"qty\">" + value + "</td>" +
                    "<td class=\"price\">" + thing.price + "</td>" +
                    "<td>" +
                        "<button class=\"btn btn-sm btn-outline-secondary\" id=\"apple-grow\">grow 25</button>" +
                        "<button class=\"btn btn-sm btn-outline-secondary\" id=\"apple-sell\">sell 25 ($" + thing.price * 25 + ")</button>" +
                    "</td>" +
                    "</tr>";
                containerElement.append(row);
            }


        });
    }
}



// timestamp
class Timestamp
{
    constructor(input)
    {
        this.totalSeconds = 0;
        this.bPeriodNeedsUpdate = true;
        /* TODO need a better name than "period" */
        this.period = new Map([
            ["year", 0],
            ["month", 0],
            ["day", 0],
            ["hour", 0],
            ["minute", 0],
            ["second", 0]
        ]);

        // set totalSeconds based on input type
        if( input instanceof Map )
        {
            if (input.has("year")) {
                this.totalSeconds += input.get("year") * secondsPerYear;
            }

            if (input.has("month")) {
                this.totalSeconds += input.get("month") * secondsPerMonth;
            }

            if (input.has("day")) {
                this.totalSeconds += input.get("day") * secondsPerDay;
            }

            if (input.has("hour")) {
                this.totalSeconds += input.get("hour") * secondsPerHour;
            }

            if (input.has("minute")) {
                this.totalSeconds += input.get("minute") * secondsPerMinute;
            }

            if (input.has("second")) {
                this.totalSeconds += input.get("second");
            }
        }
        else if( typeof input === "number" && isFinite(input) )
        {
            this.totalSeconds = input;
        }
        else
        {
            console.error("Timestamp: improper constructor called!");
        }
    }

    add(deltaTime)
    {
        // TODO accept a Map as well
        this.totalSeconds += deltaTime * timeRatio / 1000;
        this.bPeriodNeedsUpdate = true;
    }

    toString(format)
    {
        this.calcPeriod();

        switch( String(format).toLowerCase() )
        {
            // long 1: 1st of month, YYYY
            case "long1":
                return (
                    this.day + getOrdinal(this.day) + " of " + MonthNames[this.month] + ", " + this.year
                );
                break;

            // long 2: Month 1st, YYYY
            case "long2":
            break;

            // ISO 8601-ish basic
            case "8601":
                return (
                    pad(this.year, 4, 0) + "-" +
                    this.month + "-" +
                    pad(this.day, 2, 0) + "T" +
                    pad(this.hour, 2, 0) + ":" +
                    pad(this.minute, 2, 0) + ":" +
                    pad(this.second, 2, 0)
                );
                break;

            // RFC 3399-ish basic
            case "3399": 
            default:
                return (
                    pad(this.year, 4, 0) + "-" +
                    this.month + "-" +
                    pad(this.day, 2, 0) + " " +
                    pad(this.hour, 2, 0) + ":" +
                    pad(this.minute, 2, 0) + ":" +
                    pad(this.second, 2, 0)
                );
                break;
        }
    }

    calcPeriod()
    {
        if(!this.bPeriodNeedsUpdate)
        {
            return;
        }

        this.period.set("year", Math.floor(this.totalSeconds / secondsPerYear));
        this.period.set("month", Math.floor((this.totalSeconds % secondsPerYear) / secondsPerMonth));
        this.period.set("day", Math.floor((this.totalSeconds % secondsPerMonth) / secondsPerDay));
        this.period.set("hour", Math.floor((this.totalSeconds % secondsPerDay) / secondsPerHour));
        this.period.set("minute", Math.floor((this.totalSeconds % secondsPerHour) / secondsPerMinute));
        this.period.set("second", Math.floor(this.totalSeconds % secondsPerMinute));

        this.bPeriodNeedsUpdate = false;
    }

    get year()
    {
        this.calcPeriod();
        return this.period.get("year");
    }

    get month()
    {
        this.calcPeriod();
        return this.period.get("month");
    }

    get day()
    {
        this.calcPeriod();
        return this.period.get("day");
    }

    get hour()
    {
        this.calcPeriod();
        return this.period.get("hour");
    }

    get minute()
    {
        this.calcPeriod();
        return this.period.get("minute");
    }

    get second()
    {
        this.calcPeriod();
        return this.period.get("second");
    }
}





//
// globals
//

var lastTick = Date.now();

var state =
{
    savegameKey:  "innkeep-alpha-0",

    player:
    {
        name: "", // TODO prompt user on new game
        inventory: new Inventory( $("#inventory-tbody") ),
        money: 0,
        giveMoney(quantity) {
            if(quantity > 0)
            {
                this.money += quantity;
            }
            else
            {
                console.warn("Cannot give negative money. Stop that.");
            }
        },
        updateMoneyDisplay() // TODO starting to look like it might be better to make money an object
        {
            $(".player-money").html(this.money);
        }
    },

    inn:
    {
        name: "" // TODO prompt user on new game
    },

    world:
    {
        name: "A Land Down Undah",
        time: new Timestamp(0)
    },

    // saves the current game state to local storage
    save()
    {
        localStorage.setItem(this.savegameKey, JSON.stringify(this));
        console.info("Game saved."); // TODO test
    },

    // loads the game state from local storage, returns false if no state exists
    load()
    {
        // TODO test if exists
        // TODO check version numbers
    },

    // clears the existing game state from local storage, returns true on success, false if no state exists
    clear()
    {
        // TODO test if exists
        // TODO
    }
}





//
// time
//

// user-configurable values     // TODO maybe break these off into a json?

// epoch lengths
const secondsPerMinute = 60;
const minutesPerHour = 60;
const hoursPerDay = 24;
const daysPerMonth = 20;
const daysPerWeek = 5;
const monthsPerYear = 8;

// month names
const MonthNames = [
    "Coldsnap",     // Winter 2
    "Firstgreen",   // Spring 1
    "Latespring",   // Spring 2
    "Morningwarm",  // Summer 1
    "Summersend",   // Summer 2
    "Harvest",      // Fall 1
    "Redleaves",    // Fall 2
    "Longnight"     // Winter 1
];

// day names
const DayNames = [
    "Onesday",      // Day 1
    "Twosday",      // Day 2
    "Threesday",    // Day 3
    "Foursday",     // Day 4
    "Fivesday"      // Day 5
];

// ingame-to-realworld conversion ratio - time in game passes this many times faster than in the real world
const timeRatio = /*28*/ 1440;

// end of configurable values



// calculated values
const secondsPerHour = secondsPerMinute * minutesPerHour;
const secondsPerDay = secondsPerHour * hoursPerDay;
const secondsPerMonth = secondsPerDay * daysPerMonth;
const secondsPerYear = secondsPerMonth * monthsPerYear;








//
// core
//

// get everything ready to go
$(document).ready(function()
{
    console.log("hello world");
    
    

    // prepare
    // get json from server
    $.when
    (
        // load items from file
        loadJSON("data/items.json")
    ).done(function(itemsjson)
    {
        // parse loaded items        
        itemDict = parseItemDictJson(itemsjson[0]);

        // check for a savegame to load
        // TODO - for now we just add some basic stuff
        state.player.name = "Bob Robertson";
        state.inn.name = "The Exploding Knees Inn";

        // TEMP - this is done instead of loading a savegame
        // start the player off with a random yeild of apples - 6-10 bushels
        state.player.inventory.add("apple", (Math.floor(Math.random() * (10 - 6 + 1)) + 6) * 125);



        // update displays once
        itemDictUpdateDisplay($("#itemDefs-list-tbody"));
        state.player.inventory.updateDisplay();
        state.player.updateMoneyDisplay();

        // TODO there's got to be a better place to create these, or some other way to do this
        $("#apple-grow").on("click", function () {
            state.player.inventory.add("apple", 25);
            state.player.inventory.updateDisplay();
        });
        $("#apple-sell").on("click", function () {
            var profit = state.player.inventory.sell("apple", 25);
            state.player.giveMoney(profit);
            state.player.inventory.updateDisplay();
            state.player.updateMoneyDisplay();
        });



        // EXPERIMENTS
        //state.player.inventory.add("apple", 420);
        //state.player.inventory.updateDisplay();
        //console.log( state.player.inventory.get("apple") );
        // EXPERIMENTS



        // start ticking
        console.info("Setup done. Starting game!");
        requestAnimationFrame(tick);
    }
    ).fail(function (jqXHR, textStatus, errorThrown)
    {
        // TODO this can probably be simplified using only jqXHR
        // TODO if loading anywhere else, break this error handling off into another function
        switch (textStatus) {
            case "error":
                console.error("Load failed: " + textStatus + " " + jqXHR.status + " (" + errorThrown + ")");
                break;
            default:
                console.warn("Something went wrong.");
                break;
        }
    }
    );
});

// tick - main game loop
function tick()
{
    // calculate dT
    var now = Date.now();
    var deltaTime = now - lastTick;


    
    // update the ingame time
    state.world.time.add(deltaTime);



    // update displays
    updatePerformancePanel(deltaTime);

    // update time displays
    $("#world-time-display-totalSeconds").html(
        ("00000000000" + state.world.time.totalSeconds.toFixed(0)).slice(-11)
    );

    $("#world-time-display-toString").html(state.world.time.toString());
    $("#world-time-display-toString2").html(state.world.time.toString("long1"));

    var daypct = (state.world.time.totalSeconds % secondsPerDay) / secondsPerDay;
    $("#world-time-display-day-progress").find(".progress-bar").css({"width":daypct*100+"%"});
    $("#world-time-display-day-progress").find(".progress-bar").html((daypct*100).toFixed(0) + "%");




    // EXPERIMENTS

    //console.log(deltaTime + "ms passed in the real world, so " + deltaTime * timeRatio + "ms passed in game (" + deltaTime * timeRatio / 1000 + "sec, " + deltaTime * timeRatio / 1000 / 60 + " min).");

    // EXPERIMENTS



    // get ready for next dT calculation
    lastTick = now;

    // do it again
    requestAnimationFrame(tick);
}

// handles reloads and closes
$(window).on("beforeunload", function () {
    console.log("beforeUnload event!");
    //return false;
});





//
// items
//

// item dictionary, master list of all items in game
var itemDict;

// display contents of itemDict at given element
function itemDictUpdateDisplay(element)
{
    itemDict.forEach( function(value, key, map)
    {
        var row = "<tr>" +
            "<td>" + value.id + "</td>" +
            "<td>" + value.name.plural + "</td>" +
            "<td>" + value.price + "</td>" +
            "<td>" + value.description + "</td>" +
            "</tr>";
        element.append(row);
    });
}


// load JSON at url - done this way so that we can defer the rest of the setup process until loading finishes
function loadJSON(url) {
    return $.ajax({
        "url": url,
        "dataType": "json"
    });
}

// parses the given json into a map, which it then returns for use as the global itemDict
function parseItemDictJson(json)
{
    var ret = new Map();

    // process data
    console.group("Loading items:");
    console.info("File version " + json.version);

    for (var i = 0; i < json.items.length; i++)
    {
        // shove constructor info into a temporary map
        var info = new Map();
        info.set("id",              json.items[i].id);
        info.set("nameSingular",    json.items[i].name.singular);
        info.set("namePlural",      json.items[i].name.plural);
        info.set("description",     json.items[i].description);
        info.set("price",           json.items[i].price);

        // create item
        var item = new Item(info);

        // push item into return map
        ret.set(info.get("id"), item);

        console.debug("Loaded " + json.items[i].id);
    }

    console.groupEnd();

    return ret;
}

// parses a copper value and displays it in gold/silver/copper
function copperToString(c)
{
    return c + "c"; // TODO
}





//
// performance-related info
//

// stores info for use with the performance pangel
var performanceInfo = {
    fps: [],
    frametime: []
}

// updates the current fps display
function updatePerformancePanel(deltaTime)
{
    var maxSamples = 30;

    // calc fps
    performanceInfo.fps.push(1000 / deltaTime);
    while (performanceInfo.fps.length >= maxSamples)
    {
        performanceInfo.fps.shift();
    }
    var avgfps = 0;
    performanceInfo.fps.forEach(function (item, index, array) {
        avgfps += item;
    });
    avgfps /= performanceInfo.fps.length;
    $("#performance-panel").find(".fps").html(avgfps.toFixed(1));

    // now do frametime
    performanceInfo.frametime.push(deltaTime);
    while (performanceInfo.frametime.length >= maxSamples) {
        performanceInfo.frametime.shift();
    }
    var avgframetime = 0;
    performanceInfo.frametime.forEach(function (item, index, array) {
        avgframetime += item;
    });
    avgframetime /= performanceInfo.frametime.length;
    $("#performance-panel").find(".frametime").html(avgframetime.toFixed(1));
}

