Sudoku Online
=============

> Sudoku Online is a web app I created that includes 1000 sudoku puzzles. Features include drag-and-drop interactivity to simulate the feel of placing number pieces on a sudoku board, warnings for invalid number piece placements, altered navigation buttons for completed puzzles, and automatic saving of the user's progress via local storage. The web app refers to the puzzles as levels, with the difficulty level classification indicated on the home page.

### Technical Details:
* HTML/CSS/JS
* Sudoku puzzles stored in arrays of length 81 (blank cells stored as 0's)
* User progress in puzzles also stored in arrays of length 81, and is saved between different browser instances if localStorage is enabled
* Sudoku number pieces are be dragged and dropped on to the sudoku board using plain JS/jQuery (thought about using jQuery UI's Draggable, but decided not to for the fun/experience of implmementing the functionality in plain JS/jQuery)