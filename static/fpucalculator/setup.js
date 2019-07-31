// ~~~~~~~~~~~~~~~~~~~~~~~~~ INSTANTIATE VARIABLES ~~~~~~~~~~~~~~~~~~~~~~~~~

//User defined
var MFPurl = "http://www.myfitnesspal.com/food/diary/oboe_girl4";
var secret = "7648561c412a13fa7a64ea91b0ca7ea647bcd4b2";
var useDefaultFPU = false; //possible values true or false

//If useDefaultFPU is true, no further settings need to be adjusted.
//Custom settings if using custom FPU
var extTimeModifier = 0.75; //possible values 0-1.0
var fatUnitModifier = 0.11; //possible values 0-1.0
var proteinUnitModifer = 1.0; //possible values 0-1.0
var highFiberExtended = 0.2; //possible values 0-1.0
var frontloadHighProteinDose = 0.4; //possible values 0-1.0

// ~~~~~~~~~~~~~~~~~~~~~~~~~ DO NOT MODIFY BELOW THIS LINE ~~~~~~~~~~~~~~~~~~~~~~~~~

//Static
var hostname = location.protocol + '//' + location.host;
var profileURL = hostname + "/api/v1/profile.json";
var entriesURL = hostname + "/api/v1/entries.json";
var treatmentsURL = hostname + "/api/v1/treatments.json";

//Dynamic

//Time
var today;
var hours = 0;
var minutes = 0;
var timeStr = '';
var UTCtimeStr = '';

//Stats	
var currBG = 0;
var BGtrend = "";
var currProfile = "";
var currBasal = 0.0;
var currSens = 0.0;
var currCarbRatio = 0.0;
var timestamp = '';
var treatmentsArray;
var activeInsulinHours = 0;
var IOBfood = 0;
var IOBcorr = 0;
var carbAbsorbRate = 0;
var COB = 0;

//Food	
var mfpCode = '';
var mealCode = '';
var carbs = 0;
var fat = 0;
var protein = 0;
var fiber = 0;
var netCarbs = 0;
var carbEquivalents = 0;

//Dosing
var eventType = '';
var newBolus = 0;
var newBolusExt = 0;
var newBolusCarbs = 0;
var newBolusProtein = 0;
var newBolusFat = 0;
var additionalMessage = '';
var trendChar = '';
var trendText = '';
var totalBolus = 0;
var percentNow = 0;
var percentExt = 0;
var extBolusTime = 120;

// ~~~~~~~~~~~~~~~~~~~~~~~~~ DEFINE FUNCTIONS ~~~~~~~~~~~~~~~~~~~~~~~~~
// Set date/time
function getDate(exception) {
    exception = exception || "";
    today = new Date(); // for now
    hours = today.getHours();
    if (hours < 10) { hours = "0" + hours; }
    minutes = today.getMinutes();
    if (minutes < 10) { minutes = "0" + minutes; }
    timeStr = hours + ":" + minutes;
    UTCtimeStr = today.toJSON();
} // end getDate

// Clear divs without resetting all variables      
function cleardivs(exception) {
    if (exception != "Meal") {
        document.getElementById("results_meal").innerHTML = "";
        $("#results_mealdose").hide();
    }
    document.getElementById("errors").innerHTML = "";
} // end cleardivs

// Refresh/reset all data and fields	  
function resetVars(exception) {

    exception = exception || "";
    // Time
    getDate(exception);
    //Stats

    getCustomJSON(profileURL, "profile", function(returndata) {
          if (returndata == "Error pulling stats") {
              document.getElementById("errors").innerHTML = returndata + " - Profile";
          } else {
              getCustomJSON(entriesURL + "?count=12", "BG", function(returndata) {
                    if (returndata != "Error pulling stats") {
                    trendText = BGtrends();
                    document.getElementById("resultsBG").innerHTML = trendText;
                    
                    } else {
                        document.getElementById("errors").innerHTML = returndata + " - Entries";
                    }
                });
          }
          });

    //Food
    mfpCode = '';
    mealCode = '';
    resetMealData();

    //Dosing
    eventType = '';
    newBolus = 0;
    newBolusExt = 0;
    newBolusCarbs = 0;
    newBolusProtein = 0;
    newBolusFat = 0;
    additionalMessage = '';
    totalBolus = 0;
    percentNow = 0;
    percentExt = 0;
    basalnotes = '';
    extBolusTime = 120;

    //Clear all submission/result divs
    cleardivs("N/A");
    bolusCalc();
} // end resetVars   	

// Clear meal data values	
function resetMealData() {
    carbs = 0;
    fat = 0;
    protein = 0;
    fiber = 0;
    netCarbs = 0;
    carbEquivalents = 0;
    document.getElementById("carbs").value = 0;
    document.getElementById("fat").value = 0;
    document.getElementById("protein").value = 0;
    document.getElementById("fiber").value = 0;
} // end resetMealData
