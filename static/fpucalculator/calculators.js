// Calculate boluses involving food data
function bolusCalcWFood(mealName) {
    // Clear old data
    newBolus = 0;
    newBolusExt = 0;
    newBolusCarbs = 0;
    newBolusProtein = 0;
    newBolusFat = 0;
    additionalMessage = '';
    totalBolus = 0;
    percentNow = 0;
    percentExt = 0;
    netCarbs = 0;

    // Calculate net carbs
    netCarbs = carbs - fiber;

    var nullDataWarn = '';
    if (currBG === undefined) {

        nullDataWarn = "<br/>&#x2757 Current BG is undefined.";
    }


    // ~~~~~~~~~~~~~~~~~~~ NEW ALGORITHM ~~~~~~~~~~~~~~~~~~~
    var reduceBolusNowBy = 0; // used only for high fiber meals
    if ((highFiberExtended > 0) && (useDefaultFPU == false)){
        if (fiber > 10) {
            reduceBolusNowBy = highFiberExtended;
            document.getElementById("errors").innerHTML += "Refactored: High fiber, low BG<br/>";
        }
    }

    var CU = (netCarbs / 10.0);
    var origFPU = (protein * 4.0 + fat * 9.0) / 100.0;
    var newProtein;
    if (netCarbs < 10) {
        if (protein > 20) {
            newProtein = protein;
        } else {
            newProtein = 0;
        }
    } else {
        newProtein = protein - 20;
    }
    if (newProtein < 0) { newProtein = 0; }
    var newFat = (fat - 20);
    if (newFat < 0) { newFat = 0; }

    var FPU = 0;
    
    if (useDefaultFPU == false){
        document.getElementById("errors").innerHTML += "<b>Original FPU:</b> " + origFPU.toFixed(1) + " (As calculated by <a href='https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2901033/' target='_blank'>traditional algorithm</a>)<br/>";
        document.getElementById("errors").innerHTML += "<b>Net carbs:</b> " + netCarbs.toFixed(0) + " (Carbs - fiber)<br/>";
        document.getElementById("errors").innerHTML += "<b>Net protein:</b> " + newProtein + " (Protein - 20 unless meal has < 10 carbs, then count all protein)<br/>";
        document.getElementById("errors").innerHTML += "<b>Net fat:</b> " + newFat + " (Fat - 20)<br/>";
        
        FPU = (newProtein * 4.0 * proteinUnitModifer + newFat * 9.0 * fatUnitModifier) / 100.0;

        document.getElementById("errors").innerHTML += "<b>Modified FPU:</b> " + FPU.toFixed(1) + " (As calculated by user defined fat and protein modifiers, as well as 'net fat' and 'net protein')<br/>";
    }
    else{
        FPU = origFPU;
        extTimeModifier = 1.0;
    }

    var IRFactor = (10.0 / currCarbRatio);

    if(reduceBolusNowBy > 0) { document.getElementById("errors").innerHTML += "<b>Refactored:</b> High fiber meal (>10g), 20% of up front carbs shifted to extended carbs<br/>"; };
    
    newBolusCarbs = CU * IRFactor * (1 - reduceBolusNowBy);

    newBolusExt = FPU * IRFactor + (CU * IRFactor * reduceBolusNowBy);

    var CU_perc = CU / (CU + origFPU);
    if ((origFPU < 1.0) || (CU_perc > 0.8)) { extBolusTime = 0; } else if ((origFPU >= 1.0) && (origFPU < 2.0)) { extBolusTime = 180 * extTimeModifier; }
    else if ((origFPU >= 2.0) && (origFPU < 3.0)) { extBolusTime = 240 * extTimeModifier; }
    else if ((origFPU >= 3.0) && (origFPU < 4.0)) { extBolusTime = 300 * extTimeModifier; }
    else { extBolusTime = 480 * extTimeModifier; }

    extBolusTime = extBolusTime - extBolusTime % 30; // rounding up to half hours

    
    if ((origFPU < 1.0) || (extBolusTime == 0)) {
        newBolusCarbs += newBolusExt;
        newBolusExt = 0;
        extBolusTime = 0;
    }
    
    // Refactor percentages for complex meals
    if ((frontloadHighProteinDose > 0) && (useDefaultFPU == false)){
        if ((newFat == 0) && (newProtein > 0) && (netCarbs < 20)) {
            newBolusCarbs += newBolusExt;
            newBolusExt = 0;
            document.getElementById("errors").innerHTML += "<b>Refactored:</b> High protein, low fat, low carb (loads entire extended bolus into up front bolus)<br/>";
        } else if ((newFat > 0) && (newProtein > 0) && (netCarbs < 20)) {
            newBolusCarbs += newBolusExt * frontloadHighProteinDose;
            newBolusExt = newBolusExt * (1-frontloadHighProteinDose);
            document.getElementById("errors").innerHTML += "<b>Refactored:</b> High protein, high fat, low carb (loads 40% of extended bolus into up front bolus and subtracts it from extended bolus)<br/>";
        }
        if (newBolusExt <= 0) {
            extBolusTime = 0;
        }
    }

    // ~~~~~~~~~~~~~~~~~~~ END NEW ALGORITHM ~~~~~~~~~~~~~~~~~~~
    var newBolusExtAdj = newBolusExt;

    newBolus = newBolusCarbs;
    if (newBolus < 0) { // correction is greater than bolus now
        newBolus = newBolusCarbs;
        newBolusExtAdj = newBolusExtAdj;
    }

    if (newBolus < 0) { newBolus = 0; }
    if (newBolusExtAdj < 0) {
        newBolusExt = 0;
        newBolusExtAdj = 0;
        extBolusTime = "N/A";
    }
    totalBolus = newBolus + newBolusExtAdj;

    if (totalBolus < 0) { totalBolus = 0; }
    if (newBolusExtAdj == 0) { percentExt = 0; } else { percentExt = Math.round((newBolusExtAdj / totalBolus) * 100); }
    percentNow = 100 - percentExt;

    var extBolusText = '';
    var extBolusTimeText = (extBolusTime / 60.0).toFixed(1);
    if (newBolusExtAdj > 0) {
        extBolusText = " extended over " + extBolusTimeText + " hour(s). ";
    } else {
        extBolusText = ". ";
    }

    var carbUnitsNow = newBolusCarbs * currCarbRatio;
    var carbUnitsLater = newBolusExtAdj * currCarbRatio;
    carbEquivalents = carbUnitsNow.toFixed(0);
    if (carbUnitsLater > 0) {
        document.getElementById("results_meal").innerHTML += "<br/>Recommended bolus: " + carbUnitsNow.toFixed(0) + " carbs now and " + carbUnitsLater.toFixed(0) + " carbs " + extBolusText + additionalMessage + nullDataWarn;
    } else {
        document.getElementById("results_meal").innerHTML += "<br/>Recommended bolus: " + carbUnitsNow.toFixed(0) + " carbs" + extBolusText + additionalMessage + nullDataWarn;
    }
    $("#results_mealdose").show();
} // end bolusCalcWFood

// Calculate boluses for corrections only
function bolusCalc() {
    newBolus = 0;
    additionalMessage = '';
    var nullDataWarn = '';
    if (currBG === undefined) {
        nullDataWarn = "<br/>&#x2757 Current BG is undefined.";
    }
} // bolusCalc

// Bolus calc handler
function calcFoodBolus(mealOrSnack, name) {
    resetVars();
    eventType = mealOrSnack + " Bolus";
    getMealData(name, function(data) {
        if (data != "<br/>No meal data available.") {
            document.getElementById("carbs").value = carbs;
            document.getElementById("fat").value = fat;
            document.getElementById("protein").value = protein;
            document.getElementById("fiber").value = fiber;
            bolusCalcWFood(name);
        } else {
            document.getElementById("errors").innerHTML = "Couldn't get meal results";
        }
    });
} // end calcFoodBolus
