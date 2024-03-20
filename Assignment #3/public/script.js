//Current Issues
// Change font inside the boxes

//Object of colors of each player
const PlayersColor = {
  playerOne: "rgba(255, 33, 41, 0.5)",
  playerTwo: "rgba(60, 255, 255, 0.5)",
  playerThree: "rgba(149, 255, 143, 0.8)",
};

//Object of each player's turn
const Turn = {
  playerOne: true,
  playerTwo: false,
  playerThree: false,
};

//Box object, used to see the sides that are drawn
const Box = {
  minX: 0,
  maxX: 0,
  minY: 0,
  maxY: 0,
  top: false,
  right: false,
  bottom: false,
  left: false,
  completed: false,
};

//Line object to get coordinates to draw line/ verify line is valid to draw
const Line = {
  x: 0,
  y: 0,
  x2: 0,
  y2: 0,
  directionToDown: false,
  clicked: false,
};

//Number of dots on a grid (4 X 4), had open to change to 5 X 5 but removed it
let NUMBER_OF_DOTS = 4;
//Canvas element
const canvas = document.getElementById("game-board");
//Setting both width and height of canvas to number of dots * 100 + 100
//+ 100 is the buffer around the canvas
const canvasWidthHeight = NUMBER_OF_DOTS * 100 + 100;
//Array to hold the results of the previous games
let previousResults = [];
//Array to keep track of what line is highlighted, needs to be highlighted
let highlightedLines = [];
//Array to draw next line after a click and line is valid to draw
let linesToDraw = [];
//Array of the whole game state, hold the state of the boxes
let gameState = [];
//Boolean to see first turn
let firstTurn = true;
//Boolean to see if a box was just created
let boxCreated = false;
//Current player playing, i.e player's turn
let currentPlayer = 1;
//Current color corresponding to the current player, default red rgba
let currentColor = "rgba(255, 33, 41, 0.8)";
//Array of all player colors
let playerColor = Object.values(PlayersColor);
//Number of players playing, sent from home page in local storage
let numberOfPlayers = localStorage.getItem("numberOfPlayersValue")
  ? localStorage.getItem("numberOfPlayersValue")
  : 3;
//Array to keep scores
let playerScores = [0, 0, 0];

//Total number of boxes based on number of dots
let totalNumberOfBoxes = 0;
if (NUMBER_OF_DOTS == 4) {
  totalNumberOfBoxes = 9;
}

//Initializing context of canvas
let ctx = null;

//Draws grid, calls drawDots function, initializes gameState with boxes
function drawGrid() {
  NUMBER_OF_DOTS = localStorage.getItem("NUMBER_OF_DOTS")
    ? localStorage.getItem("NUMBER_OF_DOTS")
    : 4;
  drawDots();
  for (let i = 0; i < NUMBER_OF_DOTS - 1; i++) {
    let rowOfBoxes = [];
    for (let j = 0; j < NUMBER_OF_DOTS - 1; j++) {
      let box = Object.create(Box);
      box.minY = 100 * i + 100;
      box.minX = 100 * j + 100;
      box.maxY = 100 * i + 200;
      box.maxX = 100 * j + 200;
      box.top = false;
      box.right = false;
      box.bottom = false;
      box.left = false;
      box.completed = false;
      rowOfBoxes.push(box);
    }
    gameState.push(rowOfBoxes);
  }
}

//Draws the dots of the game board, called each time dots need to be drawn
function drawDots() {
  for (let j = 1; j <= NUMBER_OF_DOTS; j++) {
    for (let i = 1; i <= NUMBER_OF_DOTS; i++) {
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(100 * i, 100 * j, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

//Draws lines based on the linesToDraw array
function drawLine() {
  let line = linesToDraw[0];

  //Function to see if line is already drawn
  if (!isLineDrawnAlready(line)) {
    return;
  }

  //Remove previous highlight as line is being drawn in place of it
  removePreviousHighlighted();
  highlightedLines = [];
  updateGameState(line);

  ctx.strokeStyle = currentColor;
  ctx.setLineDash([]);
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(line.x, line.y);
  ctx.lineTo(line.x2, line.y2);
  ctx.stroke();
  //Draw dots over the ends of the lines
  drawDots();

  //If it is the first turn change turns and set first turn to false
  //Return so changeTurn function isn't called twice on the first turn
  if (firstTurn) {
    firstTurn = false;
    currentPlayer = 2;
    currentColor = playerColor[currentPlayer - 1];
    return;
  }
  //Change turn function is called
  changeTurn();
}

//Based on mouseMove event this function is called to highlight (dashed line) where user will be drawing their line
function highlightLines(mouseEvent) {
  const canvasRectangle = canvas.getBoundingClientRect();
  let mouseX = mouseEvent.clientX - canvasRectangle.left;
  let mouseY = mouseEvent.clientY - canvasRectangle.top;
  let x = Math.floor((mouseEvent.clientX - canvasRectangle.left) / 100);
  let y = Math.floor((mouseEvent.clientY - canvasRectangle.top) / 100);
  let line = Object.create(Line);

  //Conditionals for getting accurate mouse to line connection
  //i.e which line is the mouse closest too
  //Could use improvements
  if (x == 0 && y > 0 && y < 4) {
    line.x = 100;
    line.x2 = 100;
    line.y = y * 100;
    line.y2 = y * 100 + 100;
    line.directionToDown = true;
  }

  if (x > 0 && x < 4 && y == 0) {
    line.x = x * 100;
    line.x2 = x * 100 + 100;
    line.y = 100;
    line.y2 = 100;
    line.directionToDown = false;
  }
  if (x > 0 && x <= 4 && y > 0 && y <= 4) {
    line.x = x * 100;
    line.y = y * 100;

    if (mouseX - 100 * x > mouseY - 100 * y) {
      if (x == 4) return;
      line.x2 = x * 100 + 100;
      line.y2 = y * 100;
      line.directionToDown = false;
    } else {
      if (y == 4) return;
      line.x2 = x * 100;
      line.y2 = y * 100 + 100;
      line.directionToDown = true;
    }
  }

  //Function to see if line is already drawn
  if (!isLineDrawnAlready(line)) {
    return;
  }
  linesToDraw[0] = line;

  //Remove previous highlight as new mouse mouse event happened so a new line highlight is needed
  removePreviousHighlighted();
  ctx.setLineDash([5, 3]);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(line.x, line.y);
  ctx.lineTo(line.x2, line.y2);
  ctx.stroke();
  drawDots();
  highlightedLines[0] = line;
}

//Function to draw white space over the previous highlighted line
function removePreviousHighlighted() {
  let line = highlightedLines[0];

  if (line) {
    ctx.strokeStyle = "white";
    ctx.setLineDash([]);
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  }
}
//Function to check if there is a line already drawn, a gameState checker, returns a boolean
function isLineDrawnAlready(line) {
  const boxRow = line.x / 100;
  const boxCol = line.y / 100;
  let lineDrawn = false;
  try {
    if (line.directionToDown) {
      if (boxRow > 3 && !gameState[boxRow - 2][boxCol - 1].right) {
        lineDrawn = true;
      } else if (boxRow == 1 && !gameState[boxRow - 1][boxCol - 1].left) {
        lineDrawn = true;
      } else {
        if (
          !gameState[boxRow - 1][boxCol - 1].left &&
          !gameState[boxRow - 2][boxCol - 1].right
        ) {
          lineDrawn = true;
        }
      }
    } else {
      if (boxCol > 3 && !gameState[boxRow - 1][boxCol - 2].bottom) {
        lineDrawn = true;
      } else if (boxCol == 1 && !gameState[boxRow - 1][boxCol - 1].top) {
        lineDrawn = true;
      } else {
        if (
          !gameState[boxRow - 1][boxCol - 1].top &&
          !gameState[boxRow - 1][boxCol - 2].bottom
        ) {
          lineDrawn = true;
        }
      }
    }
  } catch (error) {}
  return lineDrawn;
}

//Change Turn function to change current player, current player color
function changeTurn() {
  if (firstTurn) {
    return;
  }

  if (boxCreated) {
    boxCreated = false;
    return;
  }

  if (numberOfPlayers == 2) {
    if (currentPlayer == 1) {
      currentPlayer = 2;
      currentColor = playerColor[currentPlayer - 1];
    } else {
      currentPlayer = 1;
      currentColor = playerColor[currentPlayer - 1];
    }
    return;
  }
  if (currentPlayer == 1) {
    currentPlayer = 2;
    currentColor = playerColor[currentPlayer - 1];
  } else if (currentPlayer == 2) {
    currentPlayer = 3;
    currentColor = playerColor[currentPlayer - 1];
  } else {
    currentPlayer = 1;
    currentColor = playerColor[currentPlayer - 1];
  }
}
//This function is called if a new line is drawn to update gameState
function updateGameState(line) {
  const boxRow = line.x / 100;
  const boxCol = line.y / 100;
  if (line.directionToDown) {
    if (boxRow > 3) {
      gameState[boxRow - 2][boxCol - 1].right = true;
    } else if (boxRow == 1) {
      gameState[boxRow - 1][boxCol - 1].left = true;
    } else {
      gameState[boxRow - 1][boxCol - 1].left = true;
      gameState[boxRow - 2][boxCol - 1].right = true;
    }
  } else {
    if (boxCol > 3) {
      gameState[boxRow - 1][boxCol - 2].bottom = true;
    } else if (boxCol == 1) {
      gameState[boxRow - 1][boxCol - 1].top = true;
    } else {
      gameState[boxRow - 1][boxCol - 1].top = true;
      gameState[boxRow - 1][boxCol - 2].bottom = true;
    }
  }
  //Function is called to see if the line that was drawn completes a box
  //In order to tell if it is still the same players turn
  boxCreated = checkIfNewBoxCompleted();
}

//Function to check if new box is completed in the gameState, run for however many new boxes found
//Draws a solid box with player color where they completed it, as well as writing their player number on the box
function checkIfNewBoxCompleted() {
  let newBox = false;
  for (var i = 0; i < gameState.length; i++) {
    var boxRow = gameState[i];
    for (var j = 0; j < boxRow.length; j++) {
      var box = boxRow[j];

      if (!box.completed) {
        if (box.top && box.right && box.bottom && box.left) {
          gameState[i][j].completed = true;

          playerScores[currentPlayer - 1] += 1;
          //New box was complete, decrement from the total
          totalNumberOfBoxes -= 1;

          if (ctx) {
            let startingX = (i + 1) * 100;
            let startingY = (j + 1) * 100;
            ctx.fillStyle = playerColor[currentPlayer - 1];
            ctx.fillRect(startingX, startingY, 100, 100);
            drawDots();
            ctx.font = "35px serif";
            let playerStr = "P" + currentPlayer;
            ctx.fillStyle = "black";
            let xCord = (i + 1) * 100 + 35;
            let yCord = (j + 1) * 100 + 65;
            ctx.fillText(playerStr, xCord, yCord);
          }

          //Check to see if all boxes are completed, and open result modal
          if (totalNumberOfBoxes == 0) {
            openResultModal();
          }

          newBox = true;
        }
      }
    }
  }
  return newBox;
}

//Result modal to see who won or drew the match
function openResultModal(showResultTable) {
  let modal = document.getElementById("resultModal");
  let modalResult = document.getElementById("result");
  let closeIcon = document.getElementsByClassName("close")[0];
  let restartButton = document.getElementById("restart");
  let table = document.getElementById("table");

  //Closing the modal via close button
  closeIcon.onclick = function () {
    modal.style.display = "none";
    table.style.display = "none";
  };

  //Closing the modal via clicking outside the modal
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
      table.style.display = "none";
    }
  };

  //Restart button, if clicked call restartGame function and close modal
  restartButton.onclick = function () {
    restartGame();
    modal.style.display = "none";
    table.style.display = "none";
    main();
  };

  //Home button element, if clicked take user back to home
  document.getElementById("home").onclick = function () {
    location.href = "index.html";
  };

  //findWinnersOrPlayersWhoTied function give the result of the game
  let winners = findWinnersOrPlayersWhoTied();
  let result = "";

  let roundResult = [];
  roundResult[0] = "";

  //If previous result button was clicked
  //Add the result to the table
  if (!showResultTable) {
    if (winners[1].length > 1) {
      result = "There was a tie between these players:";
      winners[1].forEach((playerNames) => {
        result += " & " + playerNames;
        let playerNameStr = playerNames + " ";

        roundResult[0] += playerNameStr;
      });
      result += ". Game Drawn.";
      roundResult[1] = "Draw";
      roundResult[2] = winners[0];
    } else {
      result = winners[1] + " Wins. Won with a score of " + winners[0] + ".";

      roundResult[0] = winners[1];
      roundResult[1] = "Won";
      roundResult[2] = winners[0];
    }
    //Add result to the head of the array to show recent result on top of the table
    previousResults.unshift(roundResult);
  }

  //If previous result button was clicked but there were no previous games completed
  if (showResultTable && previousResults.length == 0) {
    result =
      "Have not played a full game yet, complete a game to store the winner result!";
  }

  //If game was completed, this is the winning result modal
  if (showResultTable && previousResults.length > 0) {
    let table = document.getElementById("table");
    table.style.display = "inline-block";
    var tableBody = document.getElementById("tbody");
    tableBody.innerHTML = "";
    previousResults.forEach(function (rowData) {
      var row = document.createElement("tr");

      rowData.forEach(function (cellData) {
        var cell = document.createElement("td");
        cell.appendChild(document.createTextNode(cellData));
        row.appendChild(cell);
      });

      tableBody.appendChild(row);
    });
  }

  modalResult.innerHTML = result;
  modal.style.display = "block";
}

//Restart game function, resets all arrays and variables need to track the game progress
//Clears the canvas
function restartGame() {
  ctx.clearRect(0, 0, canvasWidthHeight, canvasWidthHeight);
  highlightedLines = [];
  linesToDraw = [];
  gameState = [];
  firstTurn = true;
  boxCreated = false;
  currentPlayer = 1;
  currentColor = "rgba(255, 126, 100, 1)";
  playerScores = [0, 0, 0];
  if (NUMBER_OF_DOTS == 4) {
    totalNumberOfBoxes = 9;
  }
}
//Find the players who won or tied function
//Use math max to find highest score in array of player scores
//Return the highest score and array of player names with that score
//Thus if only one name, we have a winner
//Two or more names, game is tied, works for both two player and three player games
function findWinnersOrPlayersWhoTied() {
  let winnerScore = 0;
  let playerNames = [];
  let maxScore = Math.max(...playerScores);
  winnerScore = maxScore;
  playerScores.filter((score, i) => {
    if (score === maxScore) {
      if (i == 0) {
        if (localStorage.getItem("firstPlayerName")) {
          playerNames.push(localStorage.getItem("firstPlayerName"));
        } else {
          playerNames.push(i + 1);
        }
      } else if (i == 1) {
        if (localStorage.getItem("secondPlayerName")) {
          playerNames.push(localStorage.getItem("secondPlayerName"));
        } else {
          playerNames.push(i + 1);
        }
      } else {
        if (localStorage.getItem("thirdPlayerName")) {
          playerNames.push(localStorage.getItem("thirdPlayerName"));
        } else {
          playerNames.push(i + 1);
        }
      }
    }
  });
  return [winnerScore, playerNames];
}

//Main function to call everything else
//Interval is set to update player turn and player scores every second
function main() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvasWidthHeight, canvasWidthHeight);
  drawGrid();
  canvas.addEventListener("mousemove", highlightLines);
  canvas.addEventListener("click", drawLine);

  setInterval(function () {
    let playerTurnElement = document.getElementById("players-turn");
    let currentPlayersName = null;
    if (currentPlayer == 1) {
      currentPlayersName = localStorage.getItem("firstPlayerName");
    }
    if (currentPlayer == 2) {
      currentPlayersName = localStorage.getItem("secondPlayerName");
    }
    if (currentPlayer == 3) {
      currentPlayersName = localStorage.getItem("thirdPlayerName");
    }
    playerTurnElement.innerHTML = currentPlayersName
      ? currentPlayersName + "'s Turn"
      : "Player: " + currentPlayer + "'s Turn";

    let playerOneScoreElement = document.getElementById("player-one");
    playerOneScoreElement.innerHTML = localStorage.getItem("firstPlayerName")
      ? localStorage.getItem("firstPlayerName") + ": " + playerScores[0]
      : "Player 1 : " + playerScores[0];

    let playerTwoScoreElement = document.getElementById("player-two");
    playerTwoScoreElement.innerHTML = localStorage.getItem("secondPlayerName")
      ? localStorage.getItem("secondPlayerName") + ": " + playerScores[1]
      : "Player 2 : " + playerScores[1];

    let playerThreeScoreElement = document.getElementById("player-three");
    if (numberOfPlayers == 2) {
      let thirdPlayer = document.getElementById("green-person-icon");
      thirdPlayer.style.display = "none";
    }
    playerThreeScoreElement.innerHTML = localStorage.getItem("thirdPlayerName")
      ? localStorage.getItem("thirdPlayerName") + ": " + playerScores[2]
      : "Player 3 : " + playerScores[2];
  }, 500);
}

//Condition if there is a canvas
//Since script is tied to both HTML files, only play page has canvas
if (canvas) {
  canvas.width = canvasWidthHeight;
  canvas.height = canvasWidthHeight;
  ctx = canvas.getContext("2d");

  let restartBoard = document.getElementById("restartBoard");
  restartBoard.onclick = function () {
    restartGame();
    main();
  };

  let showModal = document.getElementById("showModal");
  showModal.onclick = function () {
    openResultModal(true);
  };

  //Calling main to start the program if there is a canvas
  main();
}

//Getting all the form elements in the home page
const form = document.getElementById("homePageForm");
const firstPlayerName = document.getElementById("firstPlayerName");
const secondPlayerName = document.getElementById("secondPlayerName");
const thirdPlayerName = document.getElementById("thirdPlayerName");
const twoPlayers = document.getElementById("twoPlayers");
const threePlayers = document.getElementById("threePlayers");
//Removed the following form entries
const gridSizeFour = document.getElementById("gridSizeFour");
const gridSizeFive = document.getElementById("gridSizeFive");

const online = document.getElementById("online");

if (online) {
  online.addEventListener("click", () => {
    window.location.href = "playOnline.html";
  });
}

//If there is a form then update the local storage with all the values
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const firstPlayerNameValue = firstPlayerName.value;
    const secondPlayerNameValue = secondPlayerName.value;
    const thirdPlayerNameValue = thirdPlayerName.value;
    let numberOfPlayersValue = 3;
    if (twoPlayers.checked) numberOfPlayersValue = twoPlayers.value;
    if (threePlayers.checked) numberOfPlayersValue = threePlayers.value;

    localStorage.setItem("firstPlayerName", firstPlayerNameValue);
    localStorage.setItem("secondPlayerName", secondPlayerNameValue);
    localStorage.setItem("thirdPlayerName", thirdPlayerNameValue);
    localStorage.setItem("numberOfPlayersValue", numberOfPlayersValue);
    //Go to the play page if submit(i.e play button) on the form is clicked on
    window.location.href = "play.html";
  });
}
