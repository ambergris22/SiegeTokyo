import { storySnippets } from './story.js';

// Function to restart the siege (called when "REMATCH" button is clicked)
function restartSiege() {
  location.reload();
}

window.addEventListener('DOMContentLoaded', () => {

  let GameMode = "Classic";

  // Get the Tokyo time element
  const tokyoTimeElement = document.getElementById('tokyo-time');

  // Function to update the Tokyo time display
  function updateTokyoTime() {
    const currentTime = new Date();
    const options = {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    const tokyoTime = currentTime.toLocaleString('en-US', options);
    tokyoTimeElement.textContent = tokyoTime;
  }


  updateTokyoTime();  // Call the updateTokyoTime function initially
  setInterval(updateTokyoTime, 60000); // Update the Tokyo time every minute

  const gameTimeElement = document.getElementById('game-time');

  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let timerInterval;

  function formatTime(time) {
    return time.toString().padStart(2, '0');
  }

  function updateGameTimer() {
    seconds++;
    if (seconds >= 60) {
      seconds = 0;
      minutes++;
      if (minutes >= 60) {
        minutes = 0;
        hours++;
      }
    }

    const timeString = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
    gameTimeElement.textContent = timeString;
  }

  function startGameTimer() {
    updateGameTimer();
    timerInterval = setInterval(updateGameTimer, 1000);
  }

  const startButton = document.getElementById('start-button');
  startButton.addEventListener('click', () => {
    startGameTimer();
    startButton.disabled = true;
    startButton.classList.add('clicked');

  });

  const gameForm = document.getElementById('game-form');
  gameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    startGameTimer();
    gameForm.style.display = 'none';
  });



  // Define Rebel class
  class Rebel {
    constructor(name, faction, strength, aggression, health, weapon, luck, status) {
      this.name = name;
      this.faction = faction;
      this.strength = strength;
      this.aggression = aggression;
      this.health = health;
      this.weapon = weapon;
      this.luck = luck;
      this.status = status;

    }
    // Add methods or functions for the rebel class if needed
  }

  const chosenFactionElement = document.getElementById('chosen-faction');
  const citizensButton = document.getElementById('citizens-button');
  const ghoulsButton = document.getElementById('ghouls-button');
  const intensitySlider = document.getElementById('intensity-slider');
  let intensityValue = document.getElementById('intensity-value');
  const attackSlider = document.getElementById('attack-slider');
  let attackValueElement = document.getElementById('attack-value');
  const defenseSlider = document.getElementById('defense-slider');
  let defenseValueElement = document.getElementById('defense-value');
  const sendWave2Button = document.getElementById('send-wave-2-button');
  const sendWave3Button = document.getElementById('send-wave-3-button');

  intensityValue.innerText = `[${intensitySlider.value}]`; //make sure initial values are set on the page
  attackValueElement.innerText = `[${attackSlider.value}]`;
  defenseValueElement.innerText = `[${defenseSlider.value}]`;


  const firstwave = 120; // number of Rebels initiated in first wave
  const secondwave = 60; // number of Rebels initiated in second wave
  const thirdwave = 40; // number of Rebels initiated in third wave
  let rebelInterval = 2700; // Define the interval duration in milliseconds (5000=5 seconds)
  let rebelIntervalFast = 900; // fast mode as opposed to classic mode
  let rebelInterval2 = 1800;
  let rebelInterval2Fast = 600;
  let rebelInterval3 = 1800;
  let rebelInterval3Fast = 600;


  let firstRebelWaveComplete = false;
  let scanInterval = 2000;
  let scanIntervalFast = 1000;
  let hunterInterval = 3000;
  let hunterIntervalFast = 1000;

  const numberHunters = 8;
  const luckMultiplier = getRandomNumber(10, 99);
  const IntensitySmooth = 0.15; 
  const AttackSmooth = 0.15;
  const DefenseSmooth = 0.15;
  const whenEnemy = Math.random() < 0.5 ? 2 : 3;
  const weaponBuff = getRandomNumber(110, 190); //for second wave effect
  let rageTime = 30000; //rage time after ghoulking scream button pressed
  const rageTimeFast = 20000; //when in Fast mode

  const rageBoost = 4;
  let rageModeOn = false;// Declare the flag for Rage Mode
  const enemyBoost = 1.4;//set a boost for the enemy to make it harder

  const rebels = [];// Initialize an empty array to store the rebels
  const hunters = []; // store hunters
  const rebelPositions = {};  // Initialize an empty object to store rebel positions

  // Define the status values
  const STATUS = {
    NEUTRAL: "Neutral",
    FIGHT: "In Conflict",
    GHOUL: "Ghoul Held",
    CITIZEN: "Citizen Held",
    HUNTED: "In Conflict / Hunter"
  };

  // Create the grid cells with initial status
  const gridContainer = document.querySelector('.grid');

  // Define the number of rows and columns
  const numRows = 8; // changes need to be mirrored in css map config
  const numColumns = 12; // changes need to be mirrored in css map config

  // Create an array to store the status of each cell
  const cellStatus = [];

  // Get the #action-log element
  const actionLog = document.querySelector('#action-log');

  // Get references to the buttons
  const sendHuntersButton = document.getElementById('send-hunters-button');
  const ghoulScreamButton = document.getElementById('ghoul-scream-button');

  // Add the battleInterval duration in milliseconds (5000=5 seconds)
  const battleInterval = 3000;
  let cellRefreshInterval = 1000;

  // Initialize an empty array to store the cells that are fighting
  const fightingCells = [];

  // Disable the buttons on page load
  sendHuntersButton.disabled = true;
  ghoulScreamButton.disabled = true;

  // Flag variable to track if "snipFight" has been displayed
  let snipFightDisplayed = false;

  // Flag variable to track if first map Click has been done
  let firstMapClick = false;

  let chosenFaction = '';

  // Initialize the Attack and Defense values
  let currentIntensity = 50;
  let attackValue = 50;
  let defenseValue = 50;

  // Initialize the count variables
  let neutralCountPanel = 0;
  let fightCountPanel = 0;
  let ghoulCountPanel = 0;
  let citizenCountPanel = 0;

  // Initialize the ghoulCount and citizenCount arrays
  const ghoulCount = [];
  const citizenCount = [];
  const hunterCount = [];

  let scanPassCounter = 0; // Global variable to keep track of the scan pass count
  let isBattleWinnerDeclared = false; //has the end of the game been reached


  // Initialize the counts for all cells to 0
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numColumns; col++) {
      ghoulCount[row * numColumns + col] = 0;
      citizenCount[row * numColumns + col] = 0;
      hunterCount[row * numColumns + col] = 0;
    }
  }

  // Generate the grid cells
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numColumns; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;

      // Set the initial status of each cell to neutral
      cellStatus.push({ row, col, status: STATUS.NEUTRAL });

      // Add event listener to each cell
      cell.addEventListener('click', handleCellClick);

      gridContainer.appendChild(cell);
    }
  }


  // Function to generate a random number between min (inclusive) and max (inclusive)
  function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }



  // GAME TIMER SECTION

  // Disable the "Start" button initially
  startButton.disabled = true;
  sendWave2Button.disabled = true;
  sendWave3Button.disabled = true;

  //  On page load play the arrival sound
  const arrivalSound = document.getElementById('arrivalSound');
  //arrivalSound.playbackRate = 0.8;
  actionlogSound.volume = 0.7;
  arrivalSound.play();


  // Add event listener to the Start button
  startButton.addEventListener('click', function () {

    const classicModeRadio = document.getElementById('classicMode');
    const fastModeRadio = document.getElementById('fastMode');

    // Capture the chosen game mode
    if (classicModeRadio.checked) {
      GameMode = "Classic";
    } else if (fastModeRadio.checked) {
      GameMode = "Fast";
    }

    rebelInterval = GameMode === "Fast" ? rebelIntervalFast : rebelInterval;
    rebelInterval2 = GameMode === "Fast" ? rebelInterval2Fast : rebelInterval2;
    rebelInterval3 = GameMode === "Fast" ? rebelInterval3Fast : rebelInterval3;
    scanInterval = GameMode === "Fast" ? scanIntervalFast : scanInterval;
    hunterInterval = GameMode === "Fast" ? hunterIntervalFast : hunterInterval;
    rageTime = GameMode === "Fast" ? rageTimeFast : rageTime;


    // Disable the radio buttons
    classicModeRadio.disabled = true;
    fastModeRadio.disabled = true;
    addToActionLog(`Large scale mobilizations have been detected in the city`);
    const actionlogSound = document.getElementById('actionlogSound');
    actionlogSound.volume = 0.4;
    actionlogSound.playbackRate = 1.2;
    actionlogSound.play();

    const snippetWave1 = storySnippets.find((s) => s.title === 'snipFirstWave');
    if (snippetWave1) {
      displayStorySnippet(snippetWave1.title);
      const topRightQuadrant = document.getElementById('top-right-quadrant');
      removeAllSnipImages();// Remove all existing classes from the element
      topRightQuadrant.classList.add('background-wave1'); // Add the .background-intro class
    }

    // Initialize first wave of Rebel objects
    for (let i = 0; i < firstwave; i++) {
      const name = `${i + 1}`;
      const faction = i % 2 === 0 ? "Citizen" : "Ghoul";
      const strength = getRandomNumber(25, 99);
      const aggression = getRandomNumber(25, 99);
      const health = 100;
      const weapon = getRandomNumber(25, 75);
      const luck = getRandomNumber(10, 50);
      const status = "Alive"

      // Create a new Rebel object and push it to the rebels array
      const rebel = new Rebel(name, faction, strength, aggression, health, weapon, luck, status);
      rebels.push(rebel);
    }

    const startButton = document.querySelector("#start-button");
    //startButton.addEventListener("click", startGame);

    // loop to display the Rebels to the map every 5 seconds

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < (rebels.length - hunters.length)) {
        const rebel = rebels[currentIndex];
        const cell = getRandomCell(); // Assuming you have a function to get a random cell position
        const row = Number(cell.dataset.row); // Convert the row attribute to a number
        const col = Number(cell.dataset.col); // Convert the col attribute to a number
        displayRebelOnGrid(rebel, cellStatus, row, col);
        currentIndex++;
        if (currentIndex === 70) { InformSpecials() } //one time update with snipSpecials
      } else {
        clearInterval(interval);
        firstRebelWaveComplete = true; // Set firstRebelWaveComplete to true once all rebels are placed
        sendWave2Button.disabled = false;

      }
    }, rebelInterval);



    // Call factionAggregate() every scanInterval
    setInterval(factionAggregate, scanInterval);

    // Call battleCalculator() every battleInterval
    setInterval(battleCalculator, battleInterval);


  });
  /// END OF START BUTTON LOOP

  function InformSpecials() {
    const snippetSpecials = storySnippets.find((s) => s.title === 'snipSpecials');
    displayStorySnippet(snippetSpecials.title);
    const topRightQuadrant = document.getElementById('top-right-quadrant');
    removeAllSnipImages();// Remove all existing classes from the element
    topRightQuadrant.classList.add('background-specials'); // Add the .background-specials class
  }

  // Function to get a random grid cell position
  function getRandomCell() {
    const emptyCells = cellStatus.filter(cell => cell.status === STATUS.NEUTRAL || cell.status === STATUS.FIGHT);
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { row, col } = emptyCells[randomIndex];
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    return cell;
  }



  // Add an object to track the number of hunters in each HUNTED cell
  const huntersInHuntedCells = {};

  function getFightCell() {
    // Filter cells with status = 'fight'
    //const fightingCells = cellStatus.filter((cell) => cell.status === STATUS.FIGHT || cell.status === STATUS.HUNTED);
    const fightingCells = cellStatus.filter((cell) => cell.status === STATUS.FIGHT)
    // Check if there are any fighting cells available
    if (fightingCells.length > 0) {
      // Shuffle the fighting cells array to randomize their order
      shuffleArray(fightingCells);

      // Get the next available fighting cell from the shuffled array
      const { row, col } = fightingCells.pop();

      // Update the cell status to 'hunted' to prevent other Hunters from being placed in the same cell
      const cellIndex = cellStatus.findIndex((cell) => cell.row === row && cell.col === col);
      cellStatus[cellIndex].status = STATUS.HUNTED;

      // Check if the huntersInHuntedCells object has a property for the current cell
      if (!huntersInHuntedCells[`${row}-${col}`]) {
        huntersInHuntedCells[`${row}-${col}`] = 1;
      } else {
        huntersInHuntedCells[`${row}-${col}`]++;
      }

      // Check if there are already 2 hunters in every HUNTED cell
      if (Object.values(huntersInHuntedCells).every((count) => count >= 2)) {
        // Reset the huntersInHuntedCells object for the next round of hunters
        for (const cellKey in huntersInHuntedCells) {
          huntersInHuntedCells[cellKey] = 0;
        }
      }

      const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
      return cell;
    } else {
      // If there are no fighting cells, filter cells with status = 'hunted'
      const huntedCells = cellStatus.filter((cell) => cell.status === STATUS.HUNTED);

      // Check if there are any hunted cells available
      if (huntedCells.length > 0) {
        // Shuffle the hunted cells array to randomize their order
        shuffleArray(huntedCells);

        // Get the next available hunted cell from the shuffled array
        const { row, col } = huntedCells.pop();

        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        return cell;
      } else {
        // Handle the case when there are no fighting or hunted cells
        console.log("No fighting or hunted cells available.");
        return null; // Or you can return a default cell or take other appropriate action
      }
    }
  }



  // Function to shuffle an array using the Fisher-Yates algorithm
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  //CHOOSE FACTION SECTION
  // Add click event listeners to the buttons
  citizensButton.addEventListener('click', function () {
    chosenFaction = 'Citizens';
    citizensButton.disabled = true;
    ghoulsButton.disabled = true;
    ghoulsButton.classList.add('notclicked'); // Hide the ghouls button
    ghoulScreamButton.classList.add('notclicked'); // Hide the ghoulScream button
  });

  ghoulsButton.addEventListener('click', function () {
    chosenFaction = 'Ghouls';
    citizensButton.disabled = true;
    ghoulsButton.disabled = true;
    citizensButton.classList.add('notclicked'); // Hide the citizens button
    sendHuntersButton.classList.add('notclicked'); // Hide the sendHunters button
  });

  // Function to update the chosen faction element style
  function updateChosenFactionStyle() {
    chosenFactionElement.classList.remove('citizens', 'ghouls');

    if (chosenFaction === 'Citizens') {
      chosenFactionElement.classList.add('citizens');
    } else if (chosenFaction === 'Ghouls') {
      chosenFactionElement.classList.add('ghouls');
    }
  }

  // Update the chosen faction element text and style
  function updateChosenFaction() {
    chosenFactionElement.textContent = chosenFaction;
    updateChosenFactionStyle();
  }

  // Call the updateChosenFaction function initially to set the initial style
  updateChosenFaction();


  // Update the chosen faction when the faction buttons are clicked
  citizensButton.addEventListener('click', function () {
    chosenFaction = 'Citizens';
    chosenFactionElement.textContent = chosenFaction;
    citizensButton.disabled = true;
    ghoulsButton.disabled = true;
    startButton.disabled = false; // Enable the "Start" button
    addToActionLog(`FACTIONS are forming...`);
    handleButtonClick(citizensButton);

  });

  ghoulsButton.addEventListener('click', function () {
    chosenFaction = 'Ghouls';
    chosenFactionElement.textContent = chosenFaction;
    citizensButton.disabled = true;
    ghoulsButton.disabled = true;
    startButton.disabled = false; // Enable the "Start" button
    addToActionLog(`FACTIONS are forming...`);
    handleButtonClick(ghoulsButton)
  });




  // SLIDERS SECTION

  // Function to update the intensity value display
  function updateIntensityValue() {
    currentIntensity = intensitySlider.value;
    intensityValue.textContent = `[${currentIntensity}]`;
  }

  let intensityReached99 = false; // Flag to track if intensity has reached 99
  let intensityTimer; // Timer for delayed logging

  // Event listener for changes in the intensity slider value
  intensitySlider.addEventListener('input', () => {
    updateIntensityValue();

    // Clear the existing timer if it's still running
    clearTimeout(intensityTimer);

    // Set up a new timer for delayed logging
    intensityTimer = setTimeout(() => {
      addToActionLog(`Rebel Intensity is now ${currentIntensity}`);

      // Check if intensity slider reaches 99 for the first time
      if (currentIntensity > 80 && !intensityReached99 && !isBattleWinnerDeclared) {
        const snippetIntensity99 = storySnippets.find((s) => s.title === 'snip99Intensity');
        if (snippetIntensity99) {
          displayStorySnippet(snippetIntensity99.title);
          const topRightQuadrant = document.getElementById('top-right-quadrant');
          // Remove the background image when changing the snippet
          removeAllSnipImages();// Remove all existing classes from the element
          topRightQuadrant.classList.add('background-intensity'); // Add the .background-intro class
        }
        intensityReached99 = true; // Set the flag to true to prevent repeated logs
      }
    }, 500); // Delay in milliseconds (adjust as needed)
  });



  //snipFirstAttackSlide

  // Function to update the Attack value display
  function updateAttackValue() {
    attackValue = attackSlider.value;
    attackValueElement.textContent = `[${attackValue}]`;
  }

  // Function to update the Defense value display
  function updateDefenseValue() {
    defenseValue = defenseSlider.value;
    defenseValueElement.textContent = `[${defenseValue}]`;
  }

  let firstAttackSlide = false; // Flag to track if attack slider has been moved from 50
  let attackSliderTimer; // Timer for delayed logging

  // Add event listener to the attack slider
  attackSlider.addEventListener('input', () => {
    updateAttackValue();
    updateDefenseValueFromAttack();

    // Clear the existing timer if it's still running
    clearTimeout(attackSliderTimer);

    // Set up a new timer for delayed logging
    attackSliderTimer = setTimeout(() => {
      addToActionLog(`Rebel Attack level is now ${attackValue}`);

      // Check if attack slider is moved from 50 for the first time
      if (attackValue !== 50 && !firstAttackSlide && !isBattleWinnerDeclared) {
        const snippetAttackSlide = storySnippets.find((s) => s.title === 'snipFirstAttackSlide');
        if (snippetAttackSlide) {
          displayStorySnippet(snippetAttackSlide.title);
          const topRightQuadrant = document.getElementById('top-right-quadrant');
          // Remove the background image when changing the snippet
          removeAllSnipImages();// Remove all existing classes from the element
          topRightQuadrant.classList.add('background-attack'); // Add the .background-intro class
        }
        firstAttackSlide = true; // Set the flag to true to prevent repeated logs
      }
    }, 500); // Delay in milliseconds (adjust as needed)
  });

  let defenseSliderTimer; // Timer for delayed logging
  // Add event listener to the defense slider
  defenseSlider.addEventListener('input', () => {
    updateDefenseValue();
    updateAttackValueFromDefense();

    clearTimeout(defenseSliderTimer);// Clear the existing timer if it's still running


    defenseSliderTimer = setTimeout(() => {// Set up a new timer for delayed logging
      addToActionLog(`Rebel Defense level is now ${defenseValue}`);
      // Check if attack slider is moved from 50 for the first time
      if (attackValue !== 50 && !firstAttackSlide && !isBattleWinnerDeclared) {
        const snippetAttackSlide = storySnippets.find((s) => s.title === 'snipFirstAttackSlide');
        if (snippetAttackSlide) {
          displayStorySnippet(snippetAttackSlide.title);
          const topRightQuadrant = document.getElementById('top-right-quadrant');
          // Remove the background image when changing the snippet
          removeAllSnipImages();// Remove all existing classes from the element
          topRightQuadrant.classList.add('background-attack'); // Add the .background-intro class
        }
        firstAttackSlide = true; // Set the flag to true to prevent repeated logs
      }
    }, 500); // Delay in milliseconds (adjust as needed)
  });

  // Function to update defense value from attack value
  function updateDefenseValueFromAttack() {
    defenseValue = 100 - attackValue;
    defenseSlider.value = defenseValue;
    defenseValueElement.textContent = `[${defenseValue}]`;
  }

  // Function to update attack value from defense value
  function updateAttackValueFromDefense() {
    attackValue = 100 - defenseValue;
    attackSlider.value = attackValue;
    attackValueElement.textContent = `[${attackValue}]`;
  }

  // Call the functions initially to set the initial values
  updateAttackValue();
  updateDefenseValue();



  //SPECIAL ATTACKS

  sendHuntersButton.addEventListener('click', function () {
    sendHuntersButton.disabled = true; // once only use
    handleButtonClick(sendHuntersButton);
    addToActionLog(`#############################################################`);
    addToActionLog(`HUNTERS have been deployed to the Fight sectors. Stand By...`);
    addToActionLog(`#############################################################`);
    const HuntingSound = document.getElementById('sendHuntersSound');
    //  HuntingSound.volume = 1.0;
    HuntingSound.play();

    const snippetHunter = storySnippets.find((s) => s.title === 'snipHunters');
    if (snippetHunter) {
      displayStorySnippet(snippetHunter.title);
      const topRightQuadrant = document.getElementById('top-right-quadrant');
      // Remove the background image when changing the snippet
      removeAllSnipImages();// Remove all existing classes from the element
      topRightQuadrant.classList.add('background-hunter'); // Add the .background-intro class
    }
    // Initialize Hunter objects
    for (let i = 0; i < numberHunters; i++) {
      const name = `${i + 1}`;
      const faction = "Hunter";
      const strength = getRandomNumber(100, 150);
      const aggression = getRandomNumber(100, 150);
      const health = 100;
      const weapon = getRandomNumber(100, 150); // Add the logic to assign a random weapon here
      const luck = getRandomNumber(30, 70);
      const status = "Alive"

      // Create a new Rebel object and push it to the rebels array
      const hunter = new Rebel(name, faction, strength, aggression, health, weapon, luck, status);
      hunters.push(hunter);
      // Concatenate the hunters array into the rebels array
      rebels.push(hunter);

    }

    let hunterIndex = 0;
    const interval = setInterval(() => {
      if (hunterIndex < hunters.length) {
        const hunter = hunters[hunterIndex];
        const fightCells = getFightCell(); // Assuming you have a function to get an array of fight cells
        if (fightCells !== null) {
          const row = Number(fightCells.dataset.row); // Convert the row attribute to a number
          const col = Number(fightCells.dataset.col); // Convert the col attribute to a number
          displayHunterOnGrid(hunter, row, col);
          hunterIndex++;
        } else {
          console.log("No fight cells available for placing the hunter.");
        }
      } else {
        clearInterval(interval);
      }
    }, hunterInterval);


  });


  function enemySendHunters() {
    addToActionLog(`#############################################################`);
    addToActionLog(`HUNTERS have been deployed to the Fight sectors. Stand By...`);
    addToActionLog(`#############################################################`);
    const HuntingSound = document.getElementById('sendHuntersSound');
    HuntingSound.playbackRate = 0.8;
    HuntingSound.play();

    const snippetHunter = storySnippets.find((s) => s.title === 'snipHuntersEnemy');
    if (snippetHunter) {
      displayStorySnippet(snippetHunter.title);
      const topRightQuadrant = document.getElementById('top-right-quadrant');
      removeAllSnipImages();// Remove all existing classes from the element
      topRightQuadrant.classList.add('background-hunter'); // Add the .background-intro class
    }
    // Initialize Hunter objects
    for (let i = 0; i < numberHunters; i++) {
      const name = `${i + 1}`;
      const faction = "Hunter";
      const strength = getRandomNumber(100, 150);
      const aggression = getRandomNumber(100, 150);
      const health = 100;
      const weapon = getRandomNumber(100, 150); // Add the logic to assign a random weapon here
      const luck = getRandomNumber(30, 70);
      const status = "Alive"

      // Create a new Rebel object and push it to the rebels array
      const hunter = new Rebel(name, faction, strength, aggression, health, weapon, luck, status);
      hunters.push(hunter); // add to hunters array 
      rebels.push(hunter); // also add to rebels array 

    }

    let hunterIndex = 0;
    const Hinterval = setInterval(() => {
      if (hunterIndex < hunters.length) {
        const hunter = hunters[hunterIndex];
        const cell = getFightCell(); // Assuming you have a function to get a random cell position
   
    if (cell && cell.dataset) { // Check if the cell exists and has a valid dataset
      const row = Number(cell.dataset.row); // Convert the row attribute to a number
      const col = Number(cell.dataset.col); // Convert the col attribute to a number
      displayHunterOnGrid(hunter, row, col);
    }

    hunterIndex++;
  } else {
    clearInterval(Hinterval);
  }
}, hunterInterval);
  };


  ghoulScreamButton.addEventListener('click', function () {
    ghoulScreamButton.disabled = true; // once only use
    handleButtonClick(ghoulScreamButton);
    rageModeOn = true; // Set the rageModeOn flag to true when Rage Mode is triggered
    addToActionLog(`#######################################`);
    addToActionLog(`The GHOUL KING scream enrages the horde`);
    addToActionLog(`#######################################`);
    const ghoulScreamer = document.getElementById('ghoulScreamSound');
    ghoulScreamer.volume = 0.1;
    ghoulScreamer.play();

    let ghoulsInCells;

    const snippetGhoulKing = storySnippets.find((s) => s.title === 'snipGhoulKing');
    if (snippetGhoulKing) {
      displayStorySnippet(snippetGhoulKing.title);
      const topRightQuadrant = document.getElementById('top-right-quadrant');
      // Remove the background image when changing the snippet
      removeAllSnipImages();// Remove all existing classes from the element
      topRightQuadrant.classList.add('background-ghoulking'); // Add the .background-intro class
    }

    // Increase ghoul aggression for 30 seconds in cells marked as STATUS.FIGHT or STATUS.HUNTED
    const cellsWithFights = cellStatus.filter(cell => cell.status === STATUS.FIGHT || cell.status === STATUS.HUNTED);
    cellsWithFights.forEach(cell => {
      const { row, col } = cell;
      const cellIndex = row * numColumns + col;
      const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);

      if (cellElement) {
        cellElement.classList.remove('fighting'); // remove fight style
        cellElement.classList.add('rage'); // Apply the CSS class for rage

        // Find ghouls within the cells and increase their aggression
        ghoulsInCells = rebels.filter(rebel => rebel.faction === 'Ghoul' && rebel.status === 'Alive' && rebel.row === row && rebel.col === col);
        ghoulsInCells.forEach(ghoul => {
          ghoul.aggression *= rageBoost; // Increase ghoul aggression
          ghoul.status = 'Enraged'; // Set the ghoul status to 'Enraged'
        });
      }
    });

    // After 30 seconds, stop the rage effects
    setTimeout(() => {
      stopRageEffects();
    }, rageTime); // 30 seconds in milliseconds
  });

  function enemyGhoulScream() {
    addToActionLog(`#######################################`);
    addToActionLog(`The GHOUL KING scream enrages the horde`);
    addToActionLog(`#######################################`);
    const ghoulScreamer = document.getElementById('ghoulScreamSound');
    ghoulScreamer.volume = 0.1;
    ghoulScreamer.play();

    rageModeOn = true;
    let ghoulsInCells;

    const snippetGhoulKing = storySnippets.find((s) => s.title === 'snipGhoulKingEnemy');
    if (snippetGhoulKing) {
      displayStorySnippet(snippetGhoulKing.title);
      const topRightQuadrant = document.getElementById('top-right-quadrant');
      // Remove the background image when changing the snippet
      removeAllSnipImages();// Remove all existing classes from the element
      topRightQuadrant.classList.add('background-ghoulking'); // Add the .background-intro class
    }

    // Increase ghoul aggression for 30 seconds in cells marked as STATUS.FIGHT or STATUS.HUNTED
    const cellsWithGhouls = cellStatus.filter(cell => cell.status === STATUS.FIGHT || cell.status === STATUS.HUNTED);
    cellsWithGhouls.forEach(cell => {
      const { row, col } = cell;
      const cellIndex = row * numColumns + col;
      const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);

      if (cellElement) {
        cellElement.classList.remove('fighting'); // remove fight style
        cellElement.classList.add('rage'); // Apply the CSS class for rage

        // Find ghouls within the cells and increase their aggression
        ghoulsInCells = rebels.filter(rebel => rebel.faction === 'Ghoul' && rebel.status === 'Alive' && rebel.row === row && rebel.col === col);
        ghoulsInCells.forEach(ghoul => {
          ghoul.aggression *= rageBoost; // Increase ghoul aggression
          ghoul.status = 'Enraged'; // Set the ghoul status to 'Enraged'
        });
      }
    });

    // After 30 seconds, stop the rage effects
    setTimeout(() => {
      stopRageEffects();
    }, rageTime); // 30 seconds in milliseconds
  }









  // DISPLAY STORY


  function displayStorySnippet(event) {

 
    // Retrieve the story snippet based on the game event
    const snippet = storySnippets.find((s) => s.title.toLowerCase() === event.toLowerCase());


    // Check if a matching snippet was found
    if (snippet) {
      // Create the HTML elements to display the snippet
      const snippetContainer = document.createElement('div');
      const snippetTitle = document.createElement('h3');
      const snippetContent = document.createElement('p');

      // Set the content of the HTML elements
      snippetTitle.textContent = snippet.title;
      snippetContent.innerHTML = snippet.content;


      // Clear any existing snippets in the container
      const storyContainer = document.getElementById('story-container');
      storyContainer.innerHTML = '';

      // Append the snippet elements to the container
      //snippetContainer.appendChild(snippetTitle);
      snippetContainer.appendChild(snippetContent);
      storyContainer.appendChild(snippetContainer);

       }
    }
  

  
  
  
  
  

  // Display Snippet 1 on page load
  const snippet1 = storySnippets.find((s) => s.title === 'snipIntro');
  if (snippet1) {
    displayStorySnippet(snippet1.title);
    const topRightQuadrant = document.getElementById('top-right-quadrant');
    // Remove the background image when changing the snippet
    removeAllSnipImages();// Remove all existing classes from the element
    topRightQuadrant.classList.add('background-intro'); // Add the .background-intro class
  }


  // Function to display a rebel on the grid
  function displayRebelOnGrid(rebel, cellStatus, row, col) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`); // Retrieve the cell based on the row and column coordinates

    const rebelCircle = document.createElement("div");
    rebelCircle.className = rebel.faction === "Ghoul" ? "ghoul-circle" : "citizen-circle";
    cell.appendChild(rebelCircle);

    // Update the grid position of the rebel instance
    rebel.row = row; // Update the row position
    rebel.col = col; // Update the column position

    // Update the cell status in the cellStatus array
    const cellIndex = cellStatus.findIndex(cell => cell.row === row && cell.col === col);

    // Update the rebelPositions array with the rebel's position
    rebelPositions[rebel.name] = { row, col };

    const [Coord1, Coord2] = getCoordinates(row, col); // retrieve grid coordinates based on row and col
    console.log(`Rebel ID "${rebel.name}" placed in cell (${Coord1}${Coord2})`);

    scanPassCounter++; // Increment the scan pass count
    const scanPassNumber = document.getElementById('scan-pass-number');
    scanPassNumber.textContent = scanPassCounter; // Update the scan pass number


    updateCounts(row, col, rebel.faction); // Update the counts for the cell. 
    checkEnemy(row, col, cellStatus); // Check for ally presence in the cell
    checkAlly(row, col, cellStatus); // Check for ally presence in the cell
    updateStatusCountPanels(cellStatus);// Update the status count panels. Setting initially to FIGHT. also running via BattleFunction
  }



  function displayHunterOnGrid(rebel, row, col) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`); // Retrieve the cell based on the row and column coordinates

    const hunterCircle = document.createElement("div");
    hunterCircle.className = "hunter-circle";
    cell.appendChild(hunterCircle);

    // Update the grid position of the rebel instance
    rebel.row = row; // Update the row position
    rebel.col = col; // Update the column position

    // Update the cell status in the cellStatus array
    const cellIndex = cellStatus.findIndex(cell => cell.row === row && cell.col === col);

    // Update the rebelPositions array with the rebel's position
    rebelPositions[rebel.name] = { row, col };

    const [Coord1, Coord2] = getCoordinates(row, col); // retrieve grid coordinates based on row and col
    console.log(`Hunter"${rebel.name}" placed in cell (${Coord1}${Coord2})`);

    scanPassCounter++; // Increment the scan pass count
    const scanPassNumber = document.getElementById('scan-pass-number');
    scanPassNumber.textContent = scanPassCounter; // Update the scan pass number


    updateCounts(row, col, rebel.faction); // Update the counts for the cell. 
    checkEnemy(row, col, cellStatus); // Check for ally presence in the cell
    checkAlly(row, col, cellStatus); // Check for ally presence in the cell
    updateStatusCountPanels(cellStatus);// Update the status count panels. Setting initially to FIGHT. also running via BattleFunction

    // Call the function to display the length of the Rebels array in the console
    //showRebelsLength();
  }

  // Function to update the status of a cell
  function updateCellStatus(row, col, status) {
    // Find the cell in the cellStatus array
    const cellIndex = cellStatus.findIndex(cell => cell.row === row && cell.col === col);

    // Update the status of the cell
    if (cellIndex !== -1) {
      cellStatus[cellIndex].status = status;
    }
  }


  // Function to update the counts for the specified cell
  function updateCounts(row, col, faction) {
    const cellIndex = row * numColumns + col;
    if (faction === 'Ghoul') {
      ghoulCount[cellIndex]++;
    } else if (faction === 'Citizen' || faction === 'Hunter') {
      citizenCount[cellIndex]++;
      if (faction === 'Hunter') {
        hunterCount[cellIndex]++;
      }
    }
  }



  function checkEnemy(row, col, cellStatus) {
    // Find the cell in the cellStatus array
    const cell = cellStatus.find(cell => cell.row === row && cell.col === col);

    // Check if the cell exists and has a valid status
    if (cell && cell.status !== undefined) {
      // Check if the cell status is not Neutral, no need to proceed further
      if (cell.status !== STATUS.NEUTRAL) {
        return;
      }

      const cellIndex = row * numColumns + col;

      if (ghoulCount[cellIndex] > 0 && citizenCount[cellIndex] > 0) {
        const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        updateCellStatus(row, col, STATUS.FIGHT); // Update the cell status in the cellStatus array

        if (rageModeOn) {
          // Apply the rageBoost and rage class if rageMode is on
          const rebel = rebels.find(r => r.row === row && r.col === col && r.faction === 'Ghoul');
          if (rebel && rebel.status === 'Alive') {
            rebel.aggression *= rageBoost; // Increase ghoul aggression with rageBoost
            rebel.status = 'Enraged'; //make status ENRAGED
            cellElement.classList.add('rage'); // Apply the CSS class for rage
          }
        } else {
          // Otherwise, proceed as before if rageMode is off
          cellElement.classList.add('fighting'); // Add the "fighting" class
        }

        const [Coord1, Coord2] = getCoordinates(row, col); // retrieve grid coordinates based on row and col
        addToActionLog(`Fighting Detected in Sector ${Coord1}${Coord2}`);
        const telemetrySound = document.getElementById('telemetry');
        telemetrySound.volume = 0.8;
        telemetrySound.playbackRate = 1.5;
        telemetrySound.play();

        const cellsWithFight = cellStatus.filter(c => c.status === STATUS.FIGHT).length;


        if (cellsWithFight >= 2 && !snipFightDisplayed) {        // Call the snipFight story snippet when there are 2 cells In Conflict
          const snippetFight = storySnippets.find((s) => s.title === 'snipFight');
          if (snippetFight) {
            displayStorySnippet(snippetFight.title);
            snipFightDisplayed = true; // Set the flag to indicate the snippet has been displayed
            if (chosenFaction === 'Citizens') {
              sendHuntersButton.disabled = false;
            } else {
              ghoulScreamButton.disabled = false;
            }
            const topRightQuadrant = document.getElementById('top-right-quadrant');
            removeAllSnipImages();// Remove the background image when changing the snippet
            topRightQuadrant.classList.add('background-fight');
          }
        }
      }
    }
  }



  function checkAlly(row, col, cellStatus) {
    // Find the cell in the cellStatus array
    const cell = cellStatus.find(cell => cell.row === row && cell.col === col);

    //console.log(`checkAlly (${row}, ${col})`);

    // Check if the cell exists and has a valid status
    if (cell && cell.status !== undefined) {
      // Check if the cell status is anything but NEUTRAL, no need to proceed further
      //console.log(`PreAlly (${row}, ${col})`);
      //console.log(`cellstatus (${cell.status})`);
      if (cell.status === STATUS.NEUTRAL) {
        //  return;
        //}
        // console.log(`PostAlly (${row}, ${col})`);
        const cellIndex = row * numColumns + col;

        // Check if there are 3 rebels of the same faction and none of the opposite faction in the cell
        if (ghoulCount[cellIndex] === 3 && citizenCount[cellIndex] === 0) {
          const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
          //     const cellStatus = cellElement.dataset.status;
          //      cellElement.dataset.status = STATUS.GHOUL;
          updateCellStatus(row, col, STATUS.GHOUL); // Update the cell status in the cellStatus array
          cellElement.classList.add('ghoul'); // Add the "ghoul" class
          const [Coord1, Coord2] = getCoordinates(row, col); // retrieve grid coordinates based on row and col
          addToActionLog(`Ghouls have SECURED Sector ${Coord1}${Coord2}`);  
        } else if (ghoulCount[cellIndex] === 0 && citizenCount[cellIndex] === 3) {
          const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
          //     const cellStatus = cellElement.dataset.status;
          //       cellElement.dataset.status = STATUS.CITIZEN;
          updateCellStatus(row, col, STATUS.CITIZEN); // Update the cell status in the cellStatus array 
          cellElement.classList.add('citizen'); // Add the "citizen" class

          const [Coord1, Coord2] = getCoordinates(row, col); // retrieve grid coordinates based on row and col
          addToActionLog(`Citizens have SECURED Sector ${Coord1}${Coord2}`);  

        }
        //  console.log(`CheckAlly (${row}, ${col}) - ghoulCount: ${ghoulCount[cellIndex]}, citizenCount: ${citizenCount[cellIndex]}, cellstatus: (${cell.status})`);
      }
    }
  }

  // Function to update the count variables based on the cellStatus
  function updateCountsPanel() {
    neutralCountPanel = cellStatus.filter(cell => cell.status === STATUS.NEUTRAL).length;
    fightCountPanel = cellStatus.filter(cell => (cell.status === STATUS.FIGHT) || (cell.status === STATUS.HUNTED)).length;
    ghoulCountPanel = cellStatus.filter(cell => cell.status === STATUS.GHOUL).length;
    citizenCountPanel = cellStatus.filter(cell => cell.status === STATUS.CITIZEN).length;
  }


  // Function to update the status count panels
  function updateStatusCountPanels() {
    updateCountsPanel();

    const neutralCountElement = document.getElementById('neutral-count');
    const fightCountElement = document.getElementById('fight-count');
    const ghoulCountElement = document.getElementById('ghoul-count');
    const citizenCountElement = document.getElementById('citizen-count');

    neutralCountElement.textContent = neutralCountPanel;
    fightCountElement.textContent = fightCountPanel;
    ghoulCountElement.textContent = ghoulCountPanel;
    citizenCountElement.textContent = citizenCountPanel;
  }

  // Function to add log entry to the action log
  function addToActionLog(entry) {
    const logEntry = document.createElement('p'); // Use a <p> element for each log entry
    logEntry.style.margin = '0'; // Reset margin to reduce space
    logEntry.style.lineHeight = '1'; // Adjust line-height to reduce spacing
    logEntry.style.fontFamily = 'Courier'; // Apply the "Courier" font style
    actionLog.appendChild(logEntry);

    // Use a timer to simulate typing effect
    let index = 0;
    const typingInterval = setInterval(() => {
      // Append the next character to the log entry
      logEntry.textContent += entry[index];
      index++;

      // Check if all characters have been appended
      if (index >= entry.length) {
        // Stop the typing interval
        clearInterval(typingInterval);

        // Automatically scroll to the bottom to show the latest entry
        actionLog.scrollTop = actionLog.scrollHeight;
      }
    }, 25); // Adjust the typing speed by changing the delay (in milliseconds)
  }


  function factionAggregate() {
    //    console.log(`factionAggregate started`);

    // Get the index of the last placed rebel
    let lastPlacedIndex = -1;
    for (let i = rebels.length - 1; i >= 0; i--) {
      if (rebels[i].row !== undefined && rebels[i].col !== undefined) {
        lastPlacedIndex = i;
        break;
      }
    }

    // Filter rebels based on their faction and the last placed index
    const ghouls = rebels.slice(0, lastPlacedIndex + 1).filter(rebel => rebel.faction === 'Ghoul');
    const citizens = rebels.slice(0, lastPlacedIndex + 1).filter(rebel => rebel.faction === 'Citizen' || rebel.faction === 'Hunter');


    // Aggregate the values for ghouls
    const ghoulsAggregate = {
      strength: 0,
      aggression: 0,
      health: 0,
      weapon: 0,
      luck: 0
    };

    for (const ghoul of ghouls) {
      ghoulsAggregate.strength += ghoul.strength;
      ghoulsAggregate.aggression += ghoul.aggression;
      ghoulsAggregate.health += ghoul.health;
      ghoulsAggregate.weapon += ghoul.weapon;
      ghoulsAggregate.luck += ghoul.luck;

    }

    // Aggregate the values for citizens
    const citizensAggregate = {
      strength: 0,
      aggression: 0,
      health: 0,
      weapon: 0,
      luck: 0
    };

    for (const citizen of citizens) {
      citizensAggregate.strength += citizen.strength;
      citizensAggregate.aggression += citizen.aggression;
      citizensAggregate.health += citizen.health;
      citizensAggregate.weapon += citizen.weapon;
      citizensAggregate.luck += citizen.luck;
    }

    // Display the aggregated values in the bottom right quadrant
    const ghoulHealthElement = document.getElementById('ghoul-aggregate-health');
    const citizenHealthElement = document.getElementById('citizen-aggregate-health');
    const ghoulStrengthElement = document.getElementById('ghoul-aggregate-strength');
    const citizenStrengthElement = document.getElementById('citizen-aggregate-strength');
    const ghoulAggressionElement = document.getElementById('ghoul-aggregate-aggression');
    const citizenAggressionElement = document.getElementById('citizen-aggregate-aggression');
    const ghoulWeaponElement = document.getElementById('ghoul-aggregate-weapon');
    const citizenWeaponElement = document.getElementById('citizen-aggregate-weapon');
    // const ghoulLuckElement = document.getElementById('ghoul-aggregate-luck');
    //  const citizenLuckElement = document.getElementById('citizen-aggregate-luck');

    ghoulHealthElement.textContent = ghoulsAggregate.health;
    citizenHealthElement.textContent = citizensAggregate.health;
    ghoulStrengthElement.textContent = ghoulsAggregate.strength;
    citizenStrengthElement.textContent = citizensAggregate.strength;
    ghoulAggressionElement.textContent = ghoulsAggregate.aggression;
    citizenAggressionElement.textContent = citizensAggregate.aggression;
    ghoulWeaponElement.textContent = ghoulsAggregate.weapon;
    citizenWeaponElement.textContent = citizensAggregate.weapon;
    //  ghoulLuckElement.textContent = ghoulsAggregate.luck;
    //  citizenLuckElement.textContent = citizensAggregate.luck;
  }

  let lastClickedRow = null; //used in firstClickedMap
  let lastClickedCol = null; //used in firstClickedMap
  let intervalId = null;

  // Function to update the cell details
  function updateCellDetails(row, col) {
    const cellIndex = Number(row) * numColumns + Number(col);
    const cellDetailsElement = document.getElementById('cell-details');
    const clickedCell = cellStatus[cellIndex];
    let numGhouls = ghoulCount[cellIndex];
    let numCitizens = citizenCount[cellIndex];
    let numHunters = hunterCount[cellIndex];

    const rebelsInGhouls = rebels.filter(
      (rebel) =>
        Number(rebel.row) === Number(row) &&
        Number(rebel.col) === Number(col) &&
        rebel.faction === 'Ghoul'
    );

    let ghoulsHealth = 0;
    let ghoulsStrength = 0;
    let ghoulsAggression = 0;
    let ghoulsWeapon = 0;
    let ghoulsLuck = 0;


    for (const rebel of rebelsInGhouls) {
      ghoulsHealth += rebel.health;
      ghoulsStrength += rebel.strength;
      ghoulsAggression += rebel.aggression;
      ghoulsWeapon += rebel.weapon;
      ghoulsLuck += rebel.luck;

    }

    const rebelsInCitizens = rebels.filter(
      (rebel) =>
        Number(rebel.row) === Number(row) &&
        Number(rebel.col) === Number(col) &&
        (rebel.faction === 'Citizen' || rebel.faction === 'Hunter')
    );

    let citizensHealth = 0;
    let citizensStrength = 0;
    let citizensAggression = 0;
    let citizensWeapon = 0;
    let citizensLuck = 0;


    for (const rebel of rebelsInCitizens) {
      citizensHealth += rebel.health;
      citizensStrength += rebel.strength;
      citizensAggression += rebel.aggression;
      citizensWeapon += rebel.weapon;
      citizensLuck += rebel.luck;
    }

    numCitizens = numCitizens * 10;
    numGhouls = numGhouls * 10;
    numHunters = numHunters * 10;

    const [Coord1, Coord2] = getCoordinates(row, col); // retrieve grid coordinates based on row and col


    cellDetailsElement.innerHTML = `<font size="4">
      <span><b>SECTOR:</b> ${Coord1}${Coord2}</span><br>
      <span><b>STATUS:</b> ${clickedCell.status}</span><br><br>
      <span><b>CITIZENS:</b> ${numCitizens - numHunters} (+ Hunters: ${numHunters})</span><br>
      &emsp;&emsp;Health: ${citizensHealth}<br>
      &emsp;&emsp;Strength: ${citizensStrength}<br>
      &emsp;&emsp;Aggression: ${citizensAggression}<br>
      &emsp;&emsp;Weapon: ${citizensWeapon}<br><br>
      <span><b>GHOULS:</b> ${numGhouls}</span><br>
      &emsp;&emsp;Health: ${ghoulsHealth}<br>
      &emsp;&emsp;Strength: ${ghoulsStrength}<br>
      &emsp;&emsp;Aggression: ${ghoulsAggression}<br> 
      &emsp;&emsp;Weapon: ${ghoulsWeapon}<br></font>
     `;
  }

  function handleCellClick(event) {
    const { row, col } = event.target.dataset;

    // Clear the previous interval (if any) for the last clicked cell
    if (intervalId !== null) {
      clearInterval(intervalId);
    }

    // Call the function immediately when the cell is clicked to update the details
    updateCellDetails(row, col);

    // Set the interval to refresh the cell details every 5 seconds
    intervalId = setInterval(() => updateCellDetails(row, col), cellRefreshInterval);

    // Store the row and col of the last clicked cell
    lastClickedRow = row;
    lastClickedCol = col;


    const snippetFirstClick = storySnippets.find((s) => s.title === 'snipFirstMapClick');
    if (!firstMapClick && !isBattleWinnerDeclared) {
      displayStorySnippet(snippetFirstClick.title);
      firstMapClick = true; // Set the flag to indicate the first click has occurred
      const topRightQuadrant = document.getElementById('top-right-quadrant');
      // Remove the background image when changing the snippet
      removeAllSnipImages();// Remove all existing classes from the element
      topRightQuadrant.classList.add('background-crosshairs'); // Add the .background-intro class
    }

  }

  function handleButtonClick(button) {
    // Add the "clicked" class to make the label bold
    button.classList.add('clicked');
  }


  function battleCalculator() {
    // Filter cells with status = 'fight'
    const fightingCells = cellStatus.filter(cell => cell.status === STATUS.FIGHT || cell.status === STATUS.HUNTED);

    // Loop through each fighting cell
    fightingCells.forEach(cell => {
      const { row, col } = cell;
      // Get the rebels in the cell
      const rebelsInCell = rebels.filter(rebel => Number(rebel.row) === Number(row) && Number(rebel.col) === Number(col) && (rebel.status === 'Alive' || rebel.status === 'Enraged'));

      // Separate rebels by faction
      const citizenRebels = rebelsInCell.filter(rebel => rebel.faction === 'Citizen' || rebel.faction === 'Hunter');
      const ghoulRebels = rebelsInCell.filter(rebel => rebel.faction === 'Ghoul');

      // Check if there are rebels from both factions to proceed with the battle
      if (citizenRebels.length > 0 && ghoulRebels.length > 0) {
        // Randomly select attacker and defender factions
        const attackerFaction = Math.random() < 0.5 ? 'Ghoul' : 'Citizen';
        const defenderFaction = attackerFaction === 'Citizen' ? 'Ghoul' : 'Citizen';

        // Select a random attacker and defender from their respective factions
        const attacker = attackerFaction === 'Ghoul' ? getRandomElement(ghoulRebels) : getRandomElement(citizenRebels);
        const defender = defenderFaction === 'Ghoul' ? getRandomElement(ghoulRebels) : getRandomElement(citizenRebels);

        // Determine if the attacker belongs to the chosen faction
        const isAttackerChosenFaction = attacker.faction === chosenFaction;

        let damage = 0;
        const SmoothedIntensity = Math.pow(Math.log(currentIntensity / 100 + 1) / Math.log(101), IntensitySmooth);
        const SmoothedAttack = Math.pow(Math.log(attackValue / 100 + 1) / Math.log(101), AttackSmooth);
        const SmoothedDefense = Math.pow(Math.log(defenseValue / 100 + 1) / Math.log(101), DefenseSmooth);


        // Calculate the damage based on the attacker's faction
        if (isAttackerChosenFaction) {
          damage = Math.round(Math.max(
            ((attacker.strength + attacker.aggression + attacker.weapon + (attacker.luck * luckMultiplier / 100)) * 0.25 * (SmoothedAttack * 0.02) * 0.01 * SmoothedIntensity),
            1
          ));
        } else {
          damage = Math.round(Math.max(
            ((attacker.strength + attacker.aggression + attacker.weapon + (attacker.luck * luckMultiplier / 100)) * 0.25 * (50 / SmoothedDefense) * 0.01 * enemyBoost * SmoothedIntensity),
            1
          ));
        }

        defender.health -= damage;      // Update defender's health
        console.log(`${attacker.name} (${attacker.faction}) attacked ${defender.name} (${defender.faction}) and dealt ${damage} damage.`);  // Log the battle result

        // Check if defender's health reaches zero or below
        if (defender.health <= 0) {
          defender.health = 0;
          if (defender.status === 'Enraged') {
            defender.aggression /= rageBoost // Return ghoul aggression
          };
          defender.status = 'Dead';
        }


      }
    });

    // Update the grid display after the battles
    updateGridDisplay();
    updateStatusCountPanels();
  }



  // Function to get a random element from an array
  function getRandomElement(arr) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
  }



  function updateGridDisplay() {
    // console.log(`PostBattle`);
    // Loop through each cell in the grid
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numColumns; col++) {
        const cell = cellStatus.find(cell => cell.row === row && cell.col === col);

        // Check if the cell status is STATUS.FIGHT
        if (cell.status === STATUS.FIGHT || cell.status === STATUS.HUNTED) {
          // Get rebels in the current cell
          const rebelsInCell = rebels.filter(rebel => rebel.row === row && rebel.col === col);
          // console.log(`PostBattle2`);
          // Check if there are any rebels in the cell
          if (rebelsInCell.length > 0) {
            // Calculate the aggregate total health for each faction in the cell
            let citizenTotalHealth = 0;
            let ghoulTotalHealth = 0;

            //  console.log(`PostBattle3`);

            for (const rebel of rebelsInCell) {
              if (rebel.faction === 'Citizen' || rebel.faction === 'Hunter') {
                citizenTotalHealth += rebel.health;
              } else if (rebel.faction === 'Ghoul') {
                ghoulTotalHealth += rebel.health;
              }
            }

            // Update the cell status and display based on the total health of each faction
            const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            const [Coord1, Coord2] = getCoordinates(row, col);

            if (citizenTotalHealth === 0 && ghoulTotalHealth > 0) {
              cellElement.dataset.status = STATUS.GHOUL;
              updateCellStatus(row, col, STATUS.GHOUL);
              cellElement.classList.remove('fighting');
              cellElement.classList.add('ghoul');
              addToActionLog(`Ghouls have TRIUMPHED in Sector ${Coord1}${Coord2}`);// post to action-log
            } else if (ghoulTotalHealth === 0 && citizenTotalHealth > 0) {
              cellElement.dataset.status = STATUS.CITIZEN;
              updateCellStatus(row, col, STATUS.CITIZEN);
              cellElement.classList.remove('fighting');
              cellElement.classList.add('citizen');
              addToActionLog(`Citizens were VICTORIOUS in Sector ${Coord1}${Coord2}`);// post to action-log
            } //else if (ghoulTotalHealth === 0 && citizenTotalHealth === 0) {
            // cellElement.dataset.status = STATUS.EMPTY;
            // cellElement.classList.remove('ghoul');
            // cellElement.classList.remove('citizen');
            // }
          }
        }
      }
    }
  }

  // Function to show the length of the Rebels array
  function showRebelsLength() {
    console.log(`Rebels array length: ${rebels.length}`);
  }

  // remove all images from the story snippets so that a new one can cleanly be posted

  function removeAllSnipImages() {
    const topRightQuadrant = document.getElementById('top-right-quadrant');

    topRightQuadrant.classList.remove('background-intro'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-blank'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-crosshairs'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-ghoulking'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-hunter'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-fight'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-intensity'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-attack'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-ghoulwin'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-citizenwin'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-wave1'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-wave2'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-wave3'); // Add the .background-intro class
    topRightQuadrant.classList.remove('background-specials'); // Add the .background-intro class


  }


  sendWave2Button.addEventListener('click', function () {
    // Assuming you have a function to initiate 50 rebels and get them in an array
    sendWave2Button.disabled = true;
    handleButtonClick(sendWave2Button);
    const actionlogSound = document.getElementById('actionlogSound');
    actionlogSound.volume = 0.4;
    actionlogSound.playbackRate = 1.2;
    actionlogSound.play();
    addToActionLog(`=== A SECONDARY WAVE IS INCOMING ===`);

    const snippetWave2 = storySnippets.find((s) => s.title === 'snipSecondWave');
    if (snippetWave2) {
      displayStorySnippet(snippetWave2.title);
      const topRightQuadrant = document.getElementById('top-right-quadrant');
      // Remove the background image when changing the snippet
      removeAllSnipImages();// Remove all existing classes from the element
      topRightQuadrant.classList.add('background-wave2'); // Add the .background-intro class
    }

    if (whenEnemy === 2) {
      SendEnemy()
    }

    // Initialize 2nd wave Rebel objects
    for (let i = 0; i < secondwave; i++) {
      const name = `${i + 1}`;
      const faction = i % 2 === 0 ? "Citizen" : "Ghoul";
      const strength = getRandomNumber(25, 99);
      const aggression = getRandomNumber(25, 99);
      const health = 100;
      const weapon = Math.floor(getRandomNumber(25, 99) * weaponBuff / 100); // Add the logic to assign a random weapon here
      const luck = getRandomNumber(10, 50);
      const status = "Alive"

      // Create a new Rebel object and push it to the rebels array
      const rebel = new Rebel(name, faction, strength, aggression, health, weapon, luck, status);
      rebels.push(rebel);

    }
    const weaponBuffAvg = (weaponBuff / 100).toFixed(2);

    addToActionLog(`$ WAVE 2 WEAPON BUFF = ${weaponBuffAvg}x`);

    let currentIndex = scanPassCounter;
    const interval = setInterval(() => {
      if (currentIndex < (rebels.length - hunters.length)) {
        const rebel = rebels[currentIndex];
        const cell = getRandomCell(); // Assuming you have a function to get a random cell position
        if (cell !== null) {
          const row = Number(cell.dataset.row); // Convert the row attribute to a number
          const col = Number(cell.dataset.col); // Convert the col attribute to a number
          displayRebelOnGrid(rebel, cellStatus, row, col);
          currentIndex++;
        }
      } else {
        clearInterval(interval);
        sendWave3Button.disabled = false;
      }
    }, rebelInterval2);
  });


  sendWave3Button.addEventListener('click', function () {
    sendWave3Button.disabled = true;
    handleButtonClick(sendWave3Button);
    const actionlogSound = document.getElementById('actionlogSound');
    actionlogSound.volume = 0.4;
    actionlogSound.playbackRate = 1.2;
    actionlogSound.play();
    addToActionLog(` == A THIRD WAVE OF REBELS WILL JOIN THE FIGHT ===`);
    const snippetWave3 = storySnippets.find((s) => s.title === 'snipThirdWave');
    if (snippetWave3) {
      displayStorySnippet(snippetWave3.title);
      const topRightQuadrant = document.getElementById('top-right-quadrant');
      // Remove the background image when changing the snippet
      removeAllSnipImages();// Remove all existing classes from the element
      topRightQuadrant.classList.add('background-wave3'); // Add the .background-intro class
    }
    if (whenEnemy === 3) {
      SendEnemy()
    }

    // Initialize 3rd wave Rebel objects
    for (let i = 0; i < thirdwave; i++) {
      const name = `${i + 1}`;
      const faction = i % 2 === 0 ? "Citizen" : "Ghoul";
      const strength = getRandomNumber(25, 99);
      const aggression = getRandomNumber(25, 99);
      const health = 100;
      const weapon = getRandomNumber(25, 99); // Add the logic to assign a random weapon here
      const luck = getRandomNumber(75, 99);
      const status = "Alive"

      // Create a new Rebel object and push it to the rebels array
      const rebel = new Rebel(name, faction, strength, aggression, health, weapon, luck, status);
      rebels.push(rebel);
    }

    addToActionLog(`$ WAVE 3 LUCK FACTOR = ${luckMultiplier}`);

    let currentIndex = scanPassCounter;
    let allRebelsPlaced = false;

    // Create a function to place the next rebel
    function placeRebel() {
      if (currentIndex < (rebels.length - hunters.length)) {
        const rebel = rebels[currentIndex];
        const cell = getRandomCell(); // Assuming you have a function to get a random cell position

        if (cell !== null) {
          const row = Number(cell.dataset.row); // Convert the row attribute to a number
          const col = Number(cell.dataset.col); // Convert the col attribute to a number
          displayRebelOnGrid(rebel, cellStatus, row, col);
          currentIndex++;
        }

        // Continue placing rebels after a short delay
        setTimeout(placeRebel, rebelInterval3);
      } else {
        // All rebels are placed, set the flag to true
        allRebelsPlaced = true;
      }
    }

    // Start placing the rebels
    placeRebel();

    // Check for zero cells with status = "FIGHT" every 5 seconds
    const checkConflictCellsInterval = setInterval(() => {
      const fightingCells = cellStatus.filter(cell => (cell.status === STATUS.FIGHT) || (cell.status === STATUS.HUNTED)).length;
      if (allRebelsPlaced && fightingCells === 0) {
        clearInterval(checkConflictCellsInterval);
        BattleWinner();
      }
    }, 5000); // Check every 5 seconds
  });


  function BattleWinner() {
    // Count the number of sectors held by each faction

    //const neutralCount = cellStatus.filter(cell => cell.status === STATUS.NEUTRAL).length;
    const finalfightSectors = cellStatus.filter(cell => (cell.status === STATUS.FIGHT) || (cell.status === STATUS.HUNTED)).length;
    const finalghoulSectors = cellStatus.filter(cell => cell.status === STATUS.GHOUL).length;
    const finalcitizenSectors = cellStatus.filter(cell => cell.status === STATUS.CITIZEN).length;

    // Count the number of alive and dead rebels for each faction
    let citizensAlive = 0;
    let citizensDead = 0;
    let ghoulsAlive = 0;
    let ghoulsDead = 0;

    rebels.forEach((rebel) => {
      if (rebel.status === 'Alive') {
        if (rebel.faction === 'Citizen' || rebel.faction === 'Hunter') {
          citizensAlive++;
        } else if (rebel.faction === 'Ghoul') {
          ghoulsAlive++;
        }
      } else if (rebel.status === 'Dead') {
        if (rebel.faction === 'Citizen' || rebel.faction === 'Hunter') {
          citizensDead++;
        } else if (rebel.faction === 'Ghoul') {
          ghoulsDead++;
        }
      }
    });

    // Check if the battle is over (no more "In Conflict" cells)
    if (finalfightSectors === 0) {
      sendHuntersButton.disabled = true; // if they aren't already
      ghoulScreamButton.disabled = true;

      clearInterval(battleInterval); // Stop checking for battle updates
      clearInterval(timerInterval);  // Stop the game timer

      if (finalcitizenSectors > finalghoulSectors) {
        addToActionLog(`################################################`);
        if (chosenFaction === 'Citizens') {addToActionLog(`WELL DONE! CITIZENS HAVE PREVAILED IN THE CITY!`);} //when on the winning team
        else {addToActionLog(`CITIZENS HAVE PREVAILED IN THE CITY!`);}
        addToActionLog(`################################################`);
      } else if (finalghoulSectors > finalcitizenSectors) {
        addToActionLog(`################################################`);
        if(chosenFaction === 'Ghouls'){addToActionLog(`SUCCESS! GHOULS NOW CONTROL TOKYO!`);} //when on the winning team
        else {addToActionLog(`GHOULS NOW CONTROL TOKYO!`);}
        addToActionLog(`################################################`);
      } else {
        addToActionLog(`################################################`);
        addToActionLog(`THE SIEGE IS TIED! THE STRUGGLE GOES ON.`);
        addToActionLog(`################################################`);
      }
      addToActionLog(`                                             `);
      gameOver();
    }


    const snippetStats = storySnippets.find((s) => s.title === 'snipFinalStats');
    if (snippetStats) {
      displayStorySnippet(snippetStats.title);
      const topRightQuadrant = document.getElementById('top-right-quadrant');
      removeAllSnipImages();// Remove all existing classes from the element

      if (finalcitizenSectors > finalghoulSectors) {
        topRightQuadrant.classList.add('background-citizenwin');
      } else if (finalghoulSectors > finalcitizenSectors) {
        topRightQuadrant.classList.add('background-ghoulwin');
      } else {
        topRightQuadrant.classList.add('background-fight');
      }
      const battleEndSound = document.getElementById('battleEndSound');
      battleEndSound.volume = 0.8;
      battleEndSound.play();

      // numbers boost
      citizensAlive = citizensAlive * 10;
      ghoulsAlive = ghoulsAlive * 10;
      citizensDead = citizensDead * 10;
      ghoulsDead = ghoulsDead * 10;


    }
    // Create the table HTML content
    const tableContent = `
    <tr>
      <th class="table-header"><span><b></b></span></th>
      <th class="table-header"><span><b>SECTORS</b></span></th>
      <th class="table-header"><span><b>SURVIVORS</b></span></th>
      <th class="table-header"><span><b>DEAD</b></span></th>
    </tr>
    <tr>
      <td class="table-cell-c"><span><b>Citizens</b></span></td>
      <td class="table-cell-c">${finalcitizenSectors}</td>
      <td class="table-cell-c">${citizensAlive}</td>
      <td class="table-cell-c">${citizensDead}</td>
    </tr>
    <tr>
      <td class="table-cell-g"><span><b>Ghouls</b></span></td>
      <td class="table-cell-g">${finalghoulSectors}</td>
      <td class="table-cell-g">${ghoulsAlive}</td>
      <td class="table-cell-g">${ghoulsDead}</td>
    </tr>
    <tr>
    <td colspan="4" class="rematch-cell">
      <button class="rematch-button">REMATCH</button>
    </td>
  </tr>
  `;

    // Get the battle results container
    const battleResultsContainer = document.getElementById('battle-results-container');

    // Create a new div element to hold the table
    const tableDiv = document.createElement('div');
    tableDiv.innerHTML = `<table id="battle-results">${tableContent}</table>`;

    // Clear any existing content and append the new table to the container
    battleResultsContainer.innerHTML = '';
    battleResultsContainer.appendChild(tableDiv);

    // Add event listener for the "REMATCH" button
    const rematchButton = battleResultsContainer.querySelector('.rematch-button');
    rematchButton.addEventListener('click', restartSiege);

    isBattleWinnerDeclared = true;
    intensitySlider.disabled = true;
    attackSlider.disabled = true;
    defenseSlider.disabled = true;

  }

  function stopRageEffects() {
    rageModeOn = false;

    // Find the enraged ghouls and reset their aggression
    const enragedGhouls = rebels.filter(rebel => /*rebel.faction === 'Ghoul' && */rebel.status === 'Enraged');
    enragedGhouls.forEach(ghoul => {
      ghoul.aggression /= rageBoost; // Reset ghoul aggression back to the original value
      if (ghoul.health <= 0) {
        ghoul.status = 'Dead'; //failsafe for BattleCalculator()
      }
      else {
        ghoul.status = 'Alive';

      }

    });

    // Find the cells marked with 'rage' class and remove it
    const cellsWithRage = document.querySelectorAll('.cell.rage');
    cellsWithRage.forEach(cellElement => {
      cellElement.classList.remove('rage'); // Remove the CSS class for rage
      cellElement.classList.add('fighting'); // Return to the fighting style
    });

    rageModeOn = false; // Set rageMode to false after rage time finishes

    updateGridDisplay();

  }


  function getCoordinates(row, col) {
    let sectorAlpha = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
    const numberOfRows = row;
    const colPlus1 = parseInt(col) + 1;

    const Coord1 = sectorAlpha[numberOfRows];
    const Coord2 = colPlus1;

    return [Coord1, Coord2];
  }

 
  function SendEnemy() {
    setTimeout(() => {
      if (chosenFaction === 'Ghouls') {
        enemySendHunters();
      } else {
        enemyGhoulScream();
      }
    }, 7000);
  }

  function gameOver() {

    addToActionLog(`THANKS______╔═╗╦╔═╗╔═╗╔═╗__╔╦╗╔═╗╦╔═╦ ╦╔═╗`);
    addToActionLog(`FOR_________╚═╗║║╣ ║ ╦║╣____║ ║ ║╠╩╗╚╦╝║ ║`);
    addToActionLog(`PLAYING_____╚═╝╩╚═╝╚═╝╚═╝___╩ ╚═╝╩ ╩ ╩ ╚═╝`);

  }



});



