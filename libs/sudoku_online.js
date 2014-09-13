var VernonChuo = VernonChuo || {};

VernonChuo.SudokuOnline = function()
{
	// stores the id of the level that is currently loaded
	var current_level_id = "home",

	// stores the given numbers for the level currently loaded in array
	// format, iterating through them by row; sudoku tiles that do not
	// have given numbers are indicated by a 0 stored in the corresponding
	// array index
	//      9 2 3
	// i.e. 4 0 6 ==> [9,2,3,4,0,6,0,0,1]
	//      0 0 1
	given_numbers_arr_for_current_level = [],

	// stores the id of the unused number piece currently being dragged;
	// variable is used to determine whether a mousedown, mousemove or
	// mouseup event corresponds to a component action of the player dragging
	// an unused number piece
	unused_number_piece_being_dragged_id = "none",

	// boolean variable used to determine if the unused number piece being
	// dragged should be faded in; if it is false and
	// unused_number_piece_being_dragged_id does not store "none", then
	// the corresponding unused number piece is faded in and this variable
	// is then set to true, after which the application will not attempt
	// to fade in the number piece again
	is_draggable_unused_number_piece_displayed = false;

	var init = function()
	{
		function execute() {
			hideNavigationPanel();
			
			$("#loading_div_content").html("Loading Sudoku Online...");
			LevelControl.displayLoadingScreen();
			
			displayHomePage();
			displayNavigationPanel();

			PlayerInteractivity.repositionGameBoardArea();
			$("#navigation_panel").slimScroll({height: "auto", size: "4px"});
			$("#home").addClass("selected_level");
			EventHandlers.attachAllEventHandlers();
		}
		
		function displayHomePage () {
			$("#home_page").css({left: "0px", right: "auto"});
		}
		function hideNavigationPanel() {
			$("#navigation_panel_wrapper").css({left: "-99999px", right: "auto"});
		}
		function displayNavigationPanel() {
			$("#navigation_panel_wrapper").css({left: "0px", right: "auto"});
		}

		var public_objects =
		{
			execute : execute
		};

		return public_objects;
	}();

	var EventHandlers = function()
	{
		function attachAllEventHandlers() {
			attachEventHandlersForNavigationPanelButtons();
			attachEventHandlerForClearBoardButton();
			attachEventHandlerForInstructionPopupButton();
			attachEventHandlerForWindowObject();
			attachEventHandlersForDocumentObject();
		}
		function attachEventHandlersForNavigationPanelButtons() {
			$.each($(".navigation_panel_button"), function(index, value) {
				$("#"+value.id).click(function() {
					LevelControl.loadLevel(value.id);
				});
			});
		}
		function attachEventHandlerForClearBoardButton() {
			$("#clear_board_button").click(function() {
				LevelControl.clearBoard();
			});
		}
		function attachEventHandlerForInstructionPopupButton() {
			$("#instruction_popup_button").bind({
				mouseover : function() {
					$("#instruction_popup").css({display: "block"});
				},
				mouseout : function() {
					$("#instruction_popup").css({display: "none"});
				}
			});
		}
		function attachEventHandlerForWindowObject() {
			$(window).resize(function() {
				PlayerInteractivity.repositionGameBoardArea();
				$("#navigation_panel").slimScroll({height: "auto"});
			});
		}
		function attachEventHandlersForDocumentObject() {
			attachMouseDownEventHandlerForDocumentObject();
			attachMouseUpEventHandlerForDocumentObject();
			attachMouseMoveEventHandlerForDocumentObject();
			attachDoubleClickEventHandlerForDocumentObject();
		}
		function attachMouseDownEventHandlerForDocumentObject() {
			$(document).mousedown(function(event) {
				var clicked_obj = event.target;
				if($("#"+clicked_obj.id).hasClass("unused_number_piece")) {
					PlayerSelections.findDraggedUnusedNumberPiece(event);
				}
			});
		}
		function attachMouseUpEventHandlerForDocumentObject() {
			$(document).mouseup(function(event) {
				if(unused_number_piece_being_dragged_id != "none") {

					$("#"+unused_number_piece_being_dragged_id).css({left:"-99999px"});
					unused_number_piece_being_dragged_id = "none";
					is_draggable_unused_number_piece_displayed = false;

					var active_tile_row_num = PlayerInteractivity.getActiveTileRowNum(event),
					active_tile_column_num = PlayerInteractivity.getActiveTileColumnNum(event);

					$(".game_board_tile").css({backgroundColor:"#FFFFFF"});

					if(active_tile_row_num < 1 || active_tile_row_num > 9 || active_tile_column_num < 1 || active_tile_column_num > 9) {
						// if placing unused number piece outside of the board area, do nothing
					} else {
						// if placing unused number piece within the board area
						PlayerSelections.determineAndExecutePlayerSelection(event);
					}
				}
			});
		}

		function attachMouseMoveEventHandlerForDocumentObject() {
			$(document).mousemove(function(event){
				if(unused_number_piece_being_dragged_id != "none") {
					PlayerInteractivity.dragUnusedNumberPiece(event);
				}
			});
		}

		function attachDoubleClickEventHandlerForDocumentObject() {
			$(document).dblclick(function(event) {
				var clicked_obj = event.target;
				if($("#"+clicked_obj.id).hasClass("game_board_piece")) {
					PlayerSelections.removeDoubleClickedUsedGamePiece(event);
				}
			});
		}

		var public_objects =
		{
			attachAllEventHandlers : attachAllEventHandlers
		};

		return public_objects;
	}();

	var PlayerInteractivity = function()
	{
		var GAME_BOARD_LENGTH = 630,
			GAME_BOARD_TILE_LENGTH = 70,
			game_board_offset_left = 0,
			game_board_offset_top = 0;

		function repositionGameBoardArea() {
			var window_height = $(window).height(),
				window_width = $(window).width();

			// do not allow the game board area to be repositioned horizontally or vertically
			// if the window is resized to a size that is smaller than the minimum allowed width
			// (1200px) or the minimum allowed height (700px), respectively
			if(window_height < 700) {
				window_height = 700;
			}
			if(window_width < 1200) {
				window_width = 1200;
			}

			// position game board
			var game_board_aggregate_border_width = 22,
				offset_to_horizontally_center_game_board_area = 100;
			game_board_offset_top = (window_height - GAME_BOARD_LENGTH) / 2 - game_board_aggregate_border_width;
			game_board_offset_left = (window_width - GAME_BOARD_LENGTH) / 2 + game_board_aggregate_border_width + offset_to_horizontally_center_game_board_area;
			$("#game_board").css({top: game_board_offset_top+"px", bottom: "auto", left: game_board_offset_left+"px", right: "auto"});

			// position unused number pieces panel
			var unused_number_pieces_panel_offset_left = game_board_offset_left + GAME_BOARD_LENGTH + game_board_aggregate_border_width;
			$("#unused_number_pieces_panel").css({top: game_board_offset_top+"px", bottom: "auto", left: unused_number_pieces_panel_offset_left+"px", right: "auto"});

			// position clear board button
			var clear_board_button_offset_top = game_board_offset_top + 530;
			$("#clear_board_button").css({top: clear_board_button_offset_top+"px", bottom: "auto", left: unused_number_pieces_panel_offset_left+"px", right: "auto"});
			
			// position information box
			var information_box_width_incl_padding = 300, game_board_left_border_and_margin_width = 15,
				information_box_offset_left = game_board_offset_left - information_box_width_incl_padding - game_board_left_border_and_margin_width;
			$("#information_box").css({top: game_board_offset_top+"px", bottom: "auto", left: information_box_offset_left+"px", right: "auto"});

			// position level completed message box so that it is centered on the game board when
			// it is displayed
			var level_completed_msgbox_offset_left = game_board_offset_left + 15,
				level_completed_msgbox_offset_top = game_board_offset_top + 160;
			$("#level_completed_msgbox_wrapper").css({left: level_completed_msgbox_offset_left+"px", right: "auto", top: level_completed_msgbox_offset_top+"px", bottom: "auto"});

			// position instruction popup button
			var instruction_popup_button_offset_top = game_board_offset_top + 580,
				instruction_popup_button_offset_left = information_box_offset_left + 125;
			$("#instruction_popup_button").css({top: instruction_popup_button_offset_top+"px", bottom: "auto", left: instruction_popup_button_offset_left+"px", right: "auto"});
			
			// position instruction popup
			var instruction_popup_offset_top = game_board_offset_top - 5,
				instruction_popup_offset_left = game_board_offset_left - 5;
			$("#instruction_popup").css({top: instruction_popup_offset_top+"px", bottom: "auto", left: instruction_popup_offset_left+"px", right: "auto"});
		}

		function dragUnusedNumberPiece(event) {
			if(unused_number_piece_being_dragged_id != "none") {
				fadeInActiveDraggableUnusedGamePiece();
				centerActiveDraggableUnusedGamePieceAtCursor(event);
				highlightTileHoveredByCursor(event);
			}
		}

		function fadeInActiveDraggableUnusedGamePiece() {
			if(!is_draggable_unused_number_piece_displayed) {
				$("#"+unused_number_piece_being_dragged_id).animate({opacity: 1});
				is_draggable_unused_number_piece_displayed = true;
			}
		}

		function centerActiveDraggableUnusedGamePieceAtCursor(event) {
			var game_board_bounding_rect = document.getElementById("game_board").getBoundingClientRect(),
				game_piece_center_x = event.clientX - 20 + (game_board_offset_left - game_board_bounding_rect.left),
				game_piece_center_y = event.clientY - 20 + (game_board_offset_top - game_board_bounding_rect.top);
			$("#"+unused_number_piece_being_dragged_id).css({left: game_piece_center_x+"px", right: "auto", top: game_piece_center_y+"px", bottom: "auto"});
		}

		function highlightTileHoveredByCursor(event) {
			var active_tile_row_num = getActiveTileRowNum(event),
				active_tile_column_num = getActiveTileColumnNum(event);

			$(".game_board_tile").css({backgroundColor:"#FFFFFF"});

			var index_of_active_tile_in_given_tiles_arr = getIndexOfActiveTileInGivenTilesArr(active_tile_row_num, active_tile_column_num);
			if(given_numbers_arr_for_current_level[index_of_active_tile_in_given_tiles_arr] == 0) {
				$("#game_board_tile_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"#C2DFFF"});
			}
		}

		function getActiveTileRowNum(event) {
			var game_board_vertical_offset_from_viewport = document.getElementById("game_board").getBoundingClientRect().top;
			return Math.ceil((event.clientY - game_board_vertical_offset_from_viewport) / GAME_BOARD_TILE_LENGTH);
		}

		function getActiveTileColumnNum(event) {
			var game_board_horizontal_offset_from_viewport = document.getElementById("game_board").getBoundingClientRect().left;
			return Math.ceil((event.clientX - game_board_horizontal_offset_from_viewport) / GAME_BOARD_TILE_LENGTH);
		}

		function getIndexOfActiveTileInGivenTilesArr(active_tile_row_num, active_tile_column_num) {
			return (active_tile_row_num-1)*9 + (active_tile_column_num-1);
		}

		var public_objects =
		{
			repositionGameBoardArea : repositionGameBoardArea,
			dragUnusedNumberPiece : dragUnusedNumberPiece,
			getActiveTileRowNum : getActiveTileRowNum,
			getActiveTileColumnNum : getActiveTileColumnNum,
			getIndexOfActiveTileInGivenTilesArr : getIndexOfActiveTileInGivenTilesArr
		};

		return public_objects;
	}();

	var LevelControl = function()
	{
		function loadLevel(level_id) {
			// do nothing if player tries to load the same level
			if(current_level_id == level_id) {
				return;
			}
			
			executeLevelChange(level_id);
		}

		function executeLevelChange(level_id) {
			$("#loading_div_content").html("");
			if(current_level_id != "home") {
				var current_level_num = current_level_id.substring("level_".length).toString();
				$("#loading_div_content").html("<span class='loading_div_content_blue_text'>Your progress in level "+current_level_num+" has been saved. </span><br>");
			}

			$("#"+current_level_id).removeClass("selected_level");
			current_level_id = level_id;
			$("#"+level_id).addClass("selected_level");

			if(level_id == "home") {
				$("#loading_div_content").html($("#loading_div_content").html()+"<span class='loading_div_content_gray_text'>Loading Home Page...</span>");
				displayLoadingScreen();
				$("#game_board_area").css({left: "-99999px", right: "auto"});
				$("#home_page").css({left: "0px", right: "auto"});
			} else {
				// level_id is of the form "level_*i*" where *i* is a number,
				// so to retrieve the number of the level loaded, simply use
				// a substring operation on level_id
				var new_level_num = level_id.substring("level_".length).toString();
				$("#loading_div_content").html($("#loading_div_content").html()+"<span class='loading_div_content_gray_text'>Loading Level "+new_level_num+"...</span>");
				displayLoadingScreen();
				$("#home_page").css({left: "-99999px", right: "auto"});
				$("#game_board_area").css({left: "0px", right: "auto"});
				setGivenNumbersAndUnusedGamePiecesArraysForCurrentLevel(level_id);
				setupGameBoard(level_id);
			}
		}

		function setGivenNumbersAndUnusedGamePiecesArraysForCurrentLevel(level_id) {
			var given_numbers_arr = getGivenNumbersArrayForLevel(level_id);

			// empty given numbers array
			while(given_numbers_arr_for_current_level.length > 0) {
				given_numbers_arr_for_current_level.pop();
			}
			// populate given numbers array for current level
			for(var i = 0; i < 81; i++) {
				given_numbers_arr_for_current_level.push(given_numbers_arr[i]);
			}
		}

		function getGivenNumbersArrayForLevel(level_id) {
			switch(level_id) {
				case "level_1":
					return [0,0,7,0,1,0,0,0,0,0,1,6,5,0,9,4,7,8,0,8,5,4,3,0,9,1,0,6,0,8,7,0,2,0,9,1,5,7,0,9,0,8,2,4,3,9,0,0,3,0,0,0,0,0,8,5,0,0,7,0,0,6,0,0,6,0,0,0,5,8,0,0,0,2,0,0,0,4,0,0,5];
				case "level_2":
					return [8,0,0,0,1,6,0,0,5,5,0,4,0,0,0,0,0,0,1,6,0,2,0,4,0,3,0,0,2,5,0,0,9,7,0,1,0,0,0,5,0,1,0,0,0,6,0,1,3,0,0,4,5,0,0,1,0,8,0,7,0,2,3,0,0,0,0,0,0,6,0,4,9,0,0,4,6,0,0,0,8];
				case "level_3":
					return [0,3,0,0,7,1,0,0,0,8,0,2,0,0,9,0,0,6,0,0,0,0,2,0,4,0,3,2,0,7,0,0,3,0,8,0,9,1,0,0,0,0,5,3,0,0,0,0,4,1,7,0,6,0,0,4,0,9,0,0,0,7,0,0,0,0,1,8,0,3,0,0,0,9,1,7,0,0,0,0,5];
				case "level_4":
					return [5,6,0,0,9,0,0,3,8,4,0,7,0,3,0,2,0,5,3,0,0,0,0,0,0,0,6,1,3,0,5,0,2,0,8,9,0,0,0,0,8,0,0,0,0,8,9,6,0,1,0,5,2,3,0,1,0,0,0,0,0,5,0,7,0,0,9,2,5,0,0,1,0,5,8,6,7,1,3,4,0];
				case "level_5":
					return [2,4,0,0,7,9,0,0,1,0,0,9,5,8,0,0,7,4,0,0,8,0,0,0,2,0,0,0,8,0,0,0,6,0,0,9,6,0,0,0,0,0,0,0,8,7,0,0,1,0,0,0,2,0,0,0,4,0,0,0,9,0,0,8,2,0,0,9,1,5,0,0,9,0,0,4,6,0,0,1,2];
				case "level_6":
					return [0,0,2,0,3,0,0,0,0,4,8,9,0,0,1,7,0,3,0,0,1,0,2,8,0,0,6,0,3,0,8,0,0,0,1,4,0,0,4,1,9,0,2,0,0,0,1,8,0,4,3,0,7,0,0,9,0,3,1,2,0,0,0,8,2,0,5,0,4,0,0,0,1,4,7,9,8,0,3,0,2];
				case "level_7":
					return [0,2,8,4,0,1,0,0,9,5,1,4,8,0,0,7,0,3,0,0,7,0,0,0,8,0,4,2,0,5,0,1,0,4,0,8,8,0,6,0,3,0,0,9,1,0,3,0,0,8,0,2,7,6,0,5,9,6,0,7,3,0,2,0,4,0,0,0,0,1,6,0,0,0,0,0,5,2,0,0,0];
				case "level_8":
					return [0,0,0,0,7,0,0,0,0,4,3,6,0,9,1,0,0,0,0,7,0,6,0,2,0,5,9,6,0,4,0,8,0,0,0,0,7,0,0,0,1,0,0,0,6,3,0,0,0,0,4,5,7,0,1,6,0,0,0,0,0,0,0,2,0,0,1,0,6,0,3,5,0,4,0,0,0,0,8,0,0];
				case "level_9":
					return [0,3,9,0,0,0,8,0,0,6,1,0,0,0,7,0,9,5,0,5,8,0,0,0,0,7,0,5,0,0,7,0,8,1,0,3,0,0,0,4,6,2,9,5,7,2,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,9,0,0,0,0,0,0,0,3,0,9,0,6,0,0,0,5,0,4];
				case "level_10":
					return [0,5,8,0,0,6,0,3,0,4,2,0,5,0,8,9,7,6,9,3,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,4,0,0,0,2,0,8,0,0,0,0,0,0,0,1,0,0,0,0,4,0,0,0,0,0,0,2,1,3,7,5,0,8,0,0,0,8,7,0,1,0,5,0,3];
				default:
					break;
			}
		}

		function clearBoard() {

			var used_number_pieces_arr_for_current_level = PlayerSelections.getUsedNumberPiecesArrForCurrentLevel(current_level_id);

			// empty used number pieces array for current level
			while(used_number_pieces_arr_for_current_level.length > 0) {
				used_number_pieces_arr_for_current_level.pop();
			}

			// populate used number pieces array for current level
			for(var i = 0; i < 81; i++) {
				used_number_pieces_arr_for_current_level.push(given_numbers_arr_for_current_level[i]);
			}

			// reset game board and place the given numbers back on the board
			setupGameBoard(current_level_id);
		}

		function setupGameBoard(level_id) {
			var game_board_pieces_id_arr = ["game_board_piece_1_1","game_board_piece_1_2","game_board_piece_1_3","game_board_piece_1_4","game_board_piece_1_5","game_board_piece_1_6","game_board_piece_1_7","game_board_piece_1_8","game_board_piece_1_9","game_board_piece_2_1","game_board_piece_2_2","game_board_piece_2_3","game_board_piece_2_4","game_board_piece_2_5","game_board_piece_2_6","game_board_piece_2_7","game_board_piece_2_8","game_board_piece_2_9","game_board_piece_3_1","game_board_piece_3_2","game_board_piece_3_3","game_board_piece_3_4","game_board_piece_3_5","game_board_piece_3_6","game_board_piece_3_7","game_board_piece_3_8","game_board_piece_3_9","game_board_piece_4_1","game_board_piece_4_2","game_board_piece_4_3","game_board_piece_4_4","game_board_piece_4_5","game_board_piece_4_6","game_board_piece_4_7","game_board_piece_4_8","game_board_piece_4_9","game_board_piece_5_1","game_board_piece_5_2","game_board_piece_5_3","game_board_piece_5_4","game_board_piece_5_5","game_board_piece_5_6","game_board_piece_5_7","game_board_piece_5_8","game_board_piece_5_9","game_board_piece_6_1","game_board_piece_6_2","game_board_piece_6_3","game_board_piece_6_4","game_board_piece_6_5","game_board_piece_6_6","game_board_piece_6_7","game_board_piece_6_8","game_board_piece_6_9","game_board_piece_7_1","game_board_piece_7_2","game_board_piece_7_3","game_board_piece_7_4","game_board_piece_7_5","game_board_piece_7_6","game_board_piece_7_7","game_board_piece_7_8","game_board_piece_7_9","game_board_piece_8_1","game_board_piece_8_2","game_board_piece_8_3","game_board_piece_8_4","game_board_piece_8_5","game_board_piece_8_6","game_board_piece_8_7","game_board_piece_8_8","game_board_piece_8_9","game_board_piece_9_1","game_board_piece_9_2","game_board_piece_9_3","game_board_piece_9_4","game_board_piece_9_5","game_board_piece_9_6","game_board_piece_9_7","game_board_piece_9_8","game_board_piece_9_9"];
			
			// reset game board objects
			$(".unused_number_piece_counter").html(9);
			$(".game_board_piece").css({left: "-99999px", color: "#FFFFFF", backgroundColor: "green"});

			var used_number_pieces_arr_for_current_level = PlayerSelections.getUsedNumberPiecesArrForCurrentLevel(level_id);

			for(var i = 0; i < 81; i++) {
				if(given_numbers_arr_for_current_level[i] != 0) {
					// if the sudoku square is filled in with a given number, initialize this square (tile)
					// on the game board with a fixed game piece indicating this number
					setGamePieceAsGivenNumber(game_board_pieces_id_arr, i);
				} else {
					if(used_number_pieces_arr_for_current_level[i] != 0) {
						$("#"+game_board_pieces_id_arr[i]).html(used_number_pieces_arr_for_current_level[i]);
						$("#"+game_board_pieces_id_arr[i]).css({left: "5px", color: "#FFFFFF", backgroundColor: "green", cursor: "pointer"});
						// set counter of unused game pieces
						var unused_number_piece_counter = $("#unused_number_piece_"+used_number_pieces_arr_for_current_level[i]+"_counter").html();
						$("#unused_number_piece_"+used_number_pieces_arr_for_current_level[i]+"_counter").html(unused_number_piece_counter-1);
					}
				}
			}

			setBackgroundsForUnusedNumberPieces();
		}

		function setGamePieceAsGivenNumber(game_board_pieces_id_arr, index) {
			var given_number = given_numbers_arr_for_current_level[index];

			$("#"+game_board_pieces_id_arr[index]).html(given_number);
			$("#"+game_board_pieces_id_arr[index]).css({left: "5px", color: "#7E7E7E", backgroundColor: "#FFFFFF", cursor: "default"});

			// set counter of unused game pieces
			var unused_number_piece_counter = $("#unused_number_piece_"+given_number+"_counter").html();
			$("#unused_number_piece_"+given_number+"_counter").html(unused_number_piece_counter-1);
		}

		function setBackgroundsForUnusedNumberPieces() {
			for(var i = 1; i < 10; i++) {
				if($("#unused_number_piece_"+i+"_counter").html() == 0) {
					$("#unused_number_piece_"+i).css({backgroundColor: "gray", cursor: "default"});
				} else {
					$("#unused_number_piece_"+i).css({backgroundColor: "green", cursor: "pointer"});
				}
			}
		}

		function displayLoadingScreen() {
			$("#loading_div").css({display: "block"});
			$("#loading_div_content").animate({opacity: "1"});
			setTimeout(function() {
				$("#loading_div_content").animate({opacity: "0"});
				setTimeout(function() {
					$("#loading_div").css({display: "none"});
				}, 1000);
			}, 2000);
		}

		var public_objects =
		{
			loadLevel : loadLevel,
			clearBoard : clearBoard,
			displayLoadingScreen : displayLoadingScreen
		};

		return public_objects;
	}();

	var PlayerSelections = function()
	{
		var used_number_pieces_arr_for_level_1 = [0,0,7,0,1,0,0,0,0,0,1,6,5,0,9,4,7,8,0,8,5,4,3,0,9,1,0,6,0,8,7,0,2,0,9,1,5,7,0,9,0,8,2,4,3,9,0,0,3,0,0,0,0,0,8,5,0,0,7,0,0,6,0,0,6,0,0,0,5,8,0,0,0,2,0,0,0,4,0,0,5],
			used_number_pieces_arr_for_level_2 = [8,0,0,0,1,6,0,0,5,5,0,4,0,0,0,0,0,0,1,6,0,2,0,4,0,3,0,0,2,5,0,0,9,7,0,1,0,0,0,5,0,1,0,0,0,6,0,1,3,0,0,4,5,0,0,1,0,8,0,7,0,2,3,0,0,0,0,0,0,6,0,4,9,0,0,4,6,0,0,0,8],
			used_number_pieces_arr_for_level_3 = [0,3,0,0,7,1,0,0,0,8,0,2,0,0,9,0,0,6,0,0,0,0,2,0,4,0,3,2,0,7,0,0,3,0,8,0,9,1,0,0,0,0,5,3,0,0,0,0,4,1,7,0,6,0,0,4,0,9,0,0,0,7,0,0,0,0,1,8,0,3,0,0,0,9,1,7,0,0,0,0,5],
			used_number_pieces_arr_for_level_4 = [5,6,0,0,9,0,0,3,8,4,0,7,0,3,0,2,0,5,3,0,0,0,0,0,0,0,6,1,3,0,5,0,2,0,8,9,0,0,0,0,8,0,0,0,0,8,9,6,0,1,0,5,2,3,0,1,0,0,0,0,0,5,0,7,0,0,9,2,5,0,0,1,0,5,8,6,7,1,3,4,0],
			used_number_pieces_arr_for_level_5 = [2,4,0,0,7,9,0,0,1,0,0,9,5,8,0,0,7,4,0,0,8,0,0,0,2,0,0,0,8,0,0,0,6,0,0,9,6,0,0,0,0,0,0,0,8,7,0,0,1,0,0,0,2,0,0,0,4,0,0,0,9,0,0,8,2,0,0,9,1,5,0,0,9,0,0,4,6,0,0,1,2],
			used_number_pieces_arr_for_level_6 = [0,0,2,0,3,0,0,0,0,4,8,9,0,0,1,7,0,3,0,0,1,0,2,8,0,0,6,0,3,0,8,0,0,0,1,4,0,0,4,1,9,0,2,0,0,0,1,8,0,4,3,0,7,0,0,9,0,3,1,2,0,0,0,8,2,0,5,0,4,0,0,0,1,4,7,9,8,0,3,0,2],
			used_number_pieces_arr_for_level_7 = [0,2,8,4,0,1,0,0,9,5,1,4,8,0,0,7,0,3,0,0,7,0,0,0,8,0,4,2,0,5,0,1,0,4,0,8,8,0,6,0,3,0,0,9,1,0,3,0,0,8,0,2,7,6,0,5,9,6,0,7,3,0,2,0,4,0,0,0,0,1,6,0,0,0,0,0,5,2,0,0,0],
			used_number_pieces_arr_for_level_8 = [0,0,0,0,7,0,0,0,0,4,3,6,0,9,1,0,0,0,0,7,0,6,0,2,0,5,9,6,0,4,0,8,0,0,0,0,7,0,0,0,1,0,0,0,6,3,0,0,0,0,4,5,7,0,1,6,0,0,0,0,0,0,0,2,0,0,1,0,6,0,3,5,0,4,0,0,0,0,8,0,0],
			used_number_pieces_arr_for_level_9 = [0,3,9,0,0,0,8,0,0,6,1,0,0,0,7,0,9,5,0,5,8,0,0,0,0,7,0,5,0,0,7,0,8,1,0,3,0,0,0,4,6,2,9,5,7,2,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,9,0,0,0,0,0,0,0,3,0,9,0,6,0,0,0,5,0,4],
			used_number_pieces_arr_for_level_10 = [0,5,8,0,0,6,0,3,0,4,2,0,5,0,8,9,7,6,9,3,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,4,0,0,0,2,0,8,0,0,0,0,0,0,0,1,0,0,0,0,4,0,0,0,0,0,0,2,1,3,7,5,0,8,0,0,0,8,7,0,1,0,5,0,3],
			used_number_pieces_arr_for_level_11 = [],
			used_number_pieces_arr_for_level_12 = [],
			used_number_pieces_arr_for_level_13 = [],
			used_number_pieces_arr_for_level_14 = [],
			used_number_pieces_arr_for_level_15 = [],
			used_number_pieces_arr_for_level_16 = [],
			used_number_pieces_arr_for_level_17 = [],
			used_number_pieces_arr_for_level_18 = [],
			used_number_pieces_arr_for_level_19 = [],
			used_number_pieces_arr_for_level_20 = [],
			used_number_pieces_arr_for_level_21 = [],
			used_number_pieces_arr_for_level_22 = [],
			used_number_pieces_arr_for_level_23 = [],
			used_number_pieces_arr_for_level_24 = [],
			used_number_pieces_arr_for_level_25 = [],
			used_number_pieces_arr_for_level_26 = [],
			used_number_pieces_arr_for_level_27 = [],
			used_number_pieces_arr_for_level_28 = [],
			used_number_pieces_arr_for_level_29 = [],
			used_number_pieces_arr_for_level_30 = [];

		function determineAndExecutePlayerSelection(event) {
			var dragged_unused_number_piece_number = getDraggedNumberPieceNumber(event.target.id),
				used_number_pieces_arr_for_current_level = getUsedNumberPiecesArrForCurrentLevel(current_level_id),
				active_tile_row_num = PlayerInteractivity.getActiveTileRowNum(event),
				active_tile_column_num = PlayerInteractivity.getActiveTileColumnNum(event),
				index_of_active_tile_in_given_tiles_arr = PlayerInteractivity.getIndexOfActiveTileInGivenTilesArr(active_tile_row_num, active_tile_column_num);

			if (given_numbers_arr_for_current_level[index_of_active_tile_in_given_tiles_arr] != 0) {
				// if unused number piece is dropped on a tile with a given number
				highlightActiveTileRedAsWarning(active_tile_row_num, active_tile_column_num);
			} else if (used_number_pieces_arr_for_current_level[index_of_active_tile_in_given_tiles_arr] != 0 && given_numbers_arr_for_current_level[index_of_active_tile_in_given_tiles_arr] == 0) {
				// if replacing used number piece currently on the board with an unused one
				if(isTilePlacementValid(active_tile_row_num, active_tile_column_num, used_number_pieces_arr_for_current_level, dragged_unused_number_piece_number)) {
					replaceUsedNumberPieceWithAnUnusedOne(used_number_pieces_arr_for_current_level, dragged_unused_number_piece_number, index_of_active_tile_in_given_tiles_arr, active_tile_row_num, active_tile_column_num);
				} else {
					highlightActiveTileOrangeAsWarning(active_tile_row_num, active_tile_column_num);
				}
			} else {
				if(isTilePlacementValid(active_tile_row_num, active_tile_column_num, used_number_pieces_arr_for_current_level, dragged_unused_number_piece_number)) {
					placeUnusedNumberPieceOnBoard(dragged_unused_number_piece_number, active_tile_row_num, active_tile_column_num, index_of_active_tile_in_given_tiles_arr);
					// update and display the number piece in the active tile
					$("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).html(dragged_unused_number_piece_number);
					$("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).css({left: "5px", cursor: "pointer"});
					// update used number pieces array
					used_number_pieces_arr_for_current_level[index_of_active_tile_in_given_tiles_arr] = dragged_unused_number_piece_number;
				} else {
					highlightActiveTileOrangeAsWarning(active_tile_row_num, active_tile_column_num);
				}
			}
			displayMsgBoxIfLevelCompleted(used_number_pieces_arr_for_current_level);
		}

		function getDraggedNumberPieceNumber(dragged_tile_id) {
			return parseInt(dragged_tile_id.slice(-1));
		}

		function replaceUsedNumberPieceWithAnUnusedOne(used_number_pieces_arr_for_current_level, dragged_unused_number_piece_number, index_of_active_tile_in_given_tiles_arr, active_tile_row_num, active_tile_column_num) {
			placeUnusedNumberPieceOnBoard(dragged_unused_number_piece_number);
			removeUsedNumberPieceFromBoard(used_number_pieces_arr_for_current_level, index_of_active_tile_in_given_tiles_arr);

			// update the number piece in the active tile
			$("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).html(dragged_unused_number_piece_number);
			// update used number pieces array
			used_number_pieces_arr_for_current_level[index_of_active_tile_in_given_tiles_arr] = dragged_unused_number_piece_number;
		}

		function placeUnusedNumberPieceOnBoard(dragged_unused_number_piece_number) {
			// decrement the counter for the game piece used
			var dragged_unused_number_piece_counter = $("#unused_number_piece_"+dragged_unused_number_piece_number+"_counter").html();
			$("#unused_number_piece_"+dragged_unused_number_piece_number+"_counter").html(parseInt(dragged_unused_number_piece_counter)-1);
			if($("#unused_number_piece_"+dragged_unused_number_piece_number+"_counter").html() == 0) {
				$("#unused_number_piece_"+dragged_unused_number_piece_number).css({backgroundColor: "gray", cursor: "default"});
			}
		}

		function removeUsedNumberPieceFromBoard(used_number_pieces_arr_for_current_level, index_of_active_tile_in_given_tiles_arr) {
			// increment the counter for the number piece replaced by the number piece used above
			var replaced_number_piece_number = used_number_pieces_arr_for_current_level[index_of_active_tile_in_given_tiles_arr],
				replaced_game_piece_unused_number_piece_counter = $("#unused_number_piece_"+replaced_number_piece_number+"_counter").html();
			$("#unused_number_piece_"+replaced_number_piece_number+"_counter").html(parseInt(replaced_game_piece_unused_number_piece_counter)+1);
			if(replaced_game_piece_unused_number_piece_counter == 0) {
				$("#unused_number_piece_"+replaced_number_piece_number).css({backgroundColor: "green", cursor: "pointer"});
			}
		}

		function removeDoubleClickedUsedGamePiece(event) {
			var active_tile_row_num = PlayerInteractivity.getActiveTileRowNum(event),
				active_tile_column_num = PlayerInteractivity.getActiveTileColumnNum(event);

			var index_of_active_tile_in_given_tiles_arr = PlayerInteractivity.getIndexOfActiveTileInGivenTilesArr(active_tile_row_num, active_tile_column_num); 
			if(given_numbers_arr_for_current_level[index_of_active_tile_in_given_tiles_arr] == 0) {
				// "remove" double clicked game piece
				$("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).css({left: "-99999px"});

				// increment counter of corresponding unused game piece
				var removed_number_piece_number = $("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).html();
				var corresponding_unused_number_piece_counter = $("#unused_number_piece_"+removed_number_piece_number+"_counter").html();
				$("#unused_number_piece_"+removed_number_piece_number+"_counter").html(parseInt(corresponding_unused_number_piece_counter)+1);
				if(corresponding_unused_number_piece_counter == 0) {
					$("#unused_number_piece_"+removed_number_piece_number).css({backgroundColor: "green", cursor: "pointer"});
				}

				// update used_tiles_arr
				var used_number_pieces_arr_for_current_level = getUsedNumberPiecesArrForCurrentLevel(current_level_id);
				used_number_pieces_arr_for_current_level[index_of_active_tile_in_given_tiles_arr] = 0;
			}
		}

		function findDraggedUnusedNumberPiece(event) {
			var active_game_piece_id = event.target.id;
			if($("#"+active_game_piece_id).hasClass("unused_number_piece")) {

				if(noRemainingUnusedPieces(active_game_piece_id)) {
					return;
				}

				// store the id of the unused number piece being dragged
				unused_number_piece_being_dragged_id = "draggable_"+active_game_piece_id;

				$("#"+unused_number_piece_being_dragged_id).css({opacity:0});
			}
		}

		function noRemainingUnusedPieces(active_game_piece_id) {
			if($("#"+active_game_piece_id+"_counter").html() == 0) {
				return true;
			}
			return false;
		}

		function isTilePlacementValid(active_tile_row_num, active_tile_column_num, used_number_pieces_arr_for_current_level, dragged_unused_number_piece_number) {
			var isUniqueTileInRow = checkIfTileIsUniqueInRow(active_tile_row_num, used_number_pieces_arr_for_current_level, dragged_unused_number_piece_number),
			isUniqueTileInColumn = checkIfTileIsUniqueInColumn(active_tile_column_num, used_number_pieces_arr_for_current_level, dragged_unused_number_piece_number),
			isUniqueTileInSquare = checkIfTileIsUniqueInSquare(active_tile_row_num, active_tile_column_num, used_number_pieces_arr_for_current_level, dragged_unused_number_piece_number);
			if(isUniqueTileInRow && isUniqueTileInColumn && isUniqueTileInSquare) {
				return true;
			} else {
				return false;
			}
		}

		function checkIfTileIsUniqueInRow(active_tile_row_num, used_number_pieces_arr_for_current_level, dragged_unused_number_piece_number) {

			var numbers_in_row_of_active_cell_arr = [],
			index_of_number_in_row_of_active_cell;
			for(var i = 0; i < 9; i++) {
				index_of_number_in_row_of_active_cell = (active_tile_row_num-1)*9 + i;
				numbers_in_row_of_active_cell_arr.push(used_number_pieces_arr_for_current_level[index_of_number_in_row_of_active_cell]);
			}
			
			if($.inArray(dragged_unused_number_piece_number, numbers_in_row_of_active_cell_arr) == -1) {
				return true;
			} else {
				return false;
			}
		}

		function checkIfTileIsUniqueInColumn(active_tile_column_num, used_number_pieces_arr_for_current_level, dragged_unused_number_piece_number) {

			var numbers_in_column_of_active_cell_arr = [],
			index_of_number_in_column_of_active_cell;
			for(var i = 0; i < 9; i++) {
				index_of_number_in_column_of_active_cell = i*9 + (active_tile_column_num-1);
				numbers_in_column_of_active_cell_arr.push(used_number_pieces_arr_for_current_level[index_of_number_in_column_of_active_cell]);
			}

			if($.inArray(dragged_unused_number_piece_number, numbers_in_column_of_active_cell_arr) == -1) {
				return true;
			} else {
				return false;
			}
		}

		function checkIfTileIsUniqueInSquare(active_tile_row_num, active_tile_column_num, used_number_pieces_arr_for_current_level, dragged_unused_number_piece_number) {

			var numbers_in_square_of_active_cell_arr = [],
			index_of_number_in_square_of_active_cell;
			for(var i = 0; i < 3; i++) {
				for(var j = 0; j < 3; j++) {
					index_of_number_in_square_of_active_cell = ((Math.ceil(active_tile_row_num / 3) - 1) * 3 + i) * 9 + ((Math.ceil(active_tile_column_num / 3) - 1) * 3 + j);
					numbers_in_square_of_active_cell_arr.push(used_number_pieces_arr_for_current_level[index_of_number_in_square_of_active_cell]);
				}
			}

			if($.inArray(dragged_unused_number_piece_number, numbers_in_square_of_active_cell_arr) == -1) {
				return true;
			} else {
				return false;
			}
		}

		function getUsedNumberPiecesArrForCurrentLevel(level_id) {
			switch(level_id) {
				case "level_1":
					return used_number_pieces_arr_for_level_1;
				case "level_2":
					return used_number_pieces_arr_for_level_2;
				case "level_3":
					return used_number_pieces_arr_for_level_3;
				case "level_4":
					return used_number_pieces_arr_for_level_4;
				case "level_5":
					return used_number_pieces_arr_for_level_5;
				case "level_6":
					return used_number_pieces_arr_for_level_6;
				case "level_7":
					return used_number_pieces_arr_for_level_7;
				case "level_8":
					return used_number_pieces_arr_for_level_8;
				case "level_9":
					return used_number_pieces_arr_for_level_9;
				case "level_10":
					return used_number_pieces_arr_for_level_10;
				case "level_11":
					return used_number_pieces_arr_for_level_11;
				case "level_12":
					return used_number_pieces_arr_for_level_12;
				case "level_13":
					return used_number_pieces_arr_for_level_13;
				case "level_14":
					return used_number_pieces_arr_for_level_14;
				case "level_15":
					return used_number_pieces_arr_for_level_15;
				case "level_16":
					return used_number_pieces_arr_for_level_16;
				case "level_17":
					return used_number_pieces_arr_for_level_17;
				case "level_18":
					return used_number_pieces_arr_for_level_18;
				case "level_19":
					return used_number_pieces_arr_for_level_19;
				case "level_20":
					return used_number_pieces_arr_for_level_20;
				case "level_21":
					return used_number_pieces_arr_for_level_21;
				case "level_22":
					return used_number_pieces_arr_for_level_22;
				case "level_23":
					return used_number_pieces_arr_for_level_23;
				case "level_24":
					return used_number_pieces_arr_for_level_24;
				case "level_25":
					return used_number_pieces_arr_for_level_25;
				case "level_26":
					return used_number_pieces_arr_for_level_26;
				case "level_27":
					return used_number_pieces_arr_for_level_27;
				case "level_28":
					return used_number_pieces_arr_for_level_28;
				case "level_29":
					return used_number_pieces_arr_for_level_29;
				case "level_30":
					return used_number_pieces_arr_for_level_30;
				default:
					break;
			}
		}

		function highlightActiveTileOrangeAsWarning(active_tile_row_num, active_tile_column_num) {
			$("#game_board_tile_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"orange"});
			setTimeout(function() {
				$("#game_board_tile_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"#FFFFFF"});
			},500);
		}

		function highlightActiveTileRedAsWarning(active_tile_row_num, active_tile_column_num) {
			$("#game_board_tile_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"#CD2626"});
			$("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"#CD2626", color: "#FFFFFF"});
			setTimeout(function() {
				$("#game_board_tile_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"#FFFFFF"});
				$("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"#FFFFFF", color: "#7E7E7E"});
			},500);
		}

		function displayMsgBoxIfLevelCompleted(used_number_pieces_arr_for_current_level) {
			if($.inArray(0, used_number_pieces_arr_for_current_level) == -1) {
				displayLevelCompletedMsgBox();
				setTimeout(function() {
					hideLevelCompletedMsgBox();
				}, 3000);
			}
		}

		function displayLevelCompletedMsgBox() {
			$("#level_completed_msgbox_wrapper").css({display: "block"});
			$("#level_completed_msgbox").animate({opacity: "1"});
		}

		function hideLevelCompletedMsgBox() {
			$("#level_completed_msgbox").animate({opacity: "0"});
			setTimeout(function() {
				$("#level_completed_msgbox_wrapper").css({display: "none"});
			}, 1000);
		}

		var public_objects =
		{
			determineAndExecutePlayerSelection : determineAndExecutePlayerSelection,
			removeDoubleClickedUsedGamePiece : removeDoubleClickedUsedGamePiece,
			findDraggedUnusedNumberPiece : findDraggedUnusedNumberPiece,
			getUsedNumberPiecesArrForCurrentLevel : getUsedNumberPiecesArrForCurrentLevel
		};

		return public_objects;
	}();

	var public_objects =
	{
		init : init
	};

	return public_objects;
}();

	
$(document).ready(function() {
	VernonChuo.SudokuOnline.init.execute();
});