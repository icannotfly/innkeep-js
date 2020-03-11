//
// datetime.js
// date and timestamps 
//



//
// configurable values
//

// epoch lengths
const secondsPerMinute  = 60;
const minutesPerHour    = 60;
const hoursPerDay       = 24;
const daysPerMonth      = 20;
const daysPerWeek       =  5;
const monthsPerYear     =  8;

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
]

// day names
const DayNames = [
    "Onesday",      // Day 1
    "Twosday",      // Day 2
    "Threesday",    // Day 3
    "Foursday",     // Day 4
    "Fivesday"      // Day 5
]



//
// calculated values
//

const secondsPerHour    = secondsPerMinute * minutesPerHour;
const secondsPerDay     = secondsPerHour * hoursPerDay;
const secondsPerMonth   = secondsPerDay * daysPerMonth;
const secondsPerYear    = secondsPerMonth * monthsPerYear;


export function hi()
{
    return secondsPerYear;
}
