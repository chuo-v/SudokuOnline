var VernonChuo = VernonChuo || {};

VernonChuo.SudokuOnline = function()
{
	// stores the id of the level that is currently loaded
	var active_level_id = "home",

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
		is_draggable_unused_number_piece_displayed = false,

	// constants for the minimum screen width/height (in pixels)
	// under which the application is not displayed and a relevant
	// message is displayed to prompt the user to use a device with
	// a larger screen to view this application
		MIN_SCREEN_WIDTH = 1024,
		MIN_SCREEN_HEIGHT = 768;

	var init = function()
	{
		var NUM_LEVELS = 1000;

		function execute() {
			// only load app if device size meets minimum requirements
			if(isNotAMobileDevice()) {
				hideNavigationPanelItems();
				
				$("#loading_div_content").html("Loading Sudoku Online...");
				LevelControl.displayLoadingScreen();
				
				displayHomePage();
				displayNavigationPanelItems();

				PlayerInteractivity.repositionGameBoardArea();
				$("#navigation_panel").slimScroll({height: "auto", size: "4px"});
				$("#home").addClass("selected_level");
				
				EventHandlers.attachAllEventHandlers();
				initializeUsedNumberPiecesArrays();
			}
		}
		
		function displayHomePage () {
			// set left as 100px to prevent home page contents from colliding with
			// navigation panel items
			$("#home_page").css({left: "100px", right: "auto"});
		}

		function hideNavigationPanelItems() {
			$("#navigation_panel_wrapper").css({left: "-99999px", right: "auto"});
			$("#navigation_panel_home_button_wrapper").css({left: "-99999px", right: "auto"});
			$("#navigation_panel_text_input_box_wrapper").css({left: "-99999px", right: "auto"});
		}
		
		function displayNavigationPanelItems() {
			$("#navigation_panel_wrapper").css({left: "0px", right: "auto"});
			$("#navigation_panel_home_button_wrapper").css({left: "0px", right: "auto"});
			$("#navigation_panel_text_input_box_wrapper").css({left: "0px", right: "auto"});
		}

		function initializeUsedNumberPiecesArrays() {	
			if(isLocalStorageEnabled()) {
				initializeUsedNumberPiecesArraysFromDataInLocalStorage();
			} else {
				initializeUsedNumberPiecesArraysAsGivenNumbers();
			}
		}

		function initializeUsedNumberPiecesArraysFromDataInLocalStorage() {
			var current_level_id,
				stored_data,
				stored_used_number_pieces_arr_for_current_level,
				used_number_pieces_arr_for_current_level;

			for(var i = 1; i <= NUM_LEVELS; i++) {
					current_level_id = "level_"+i;
					stored_data = localStorage.getItem("SudokuOnline.used_number_pieces_arr_for_"+current_level_id);
					
					if(!stored_data) {
						// if there is no corresponding data stored in localStorage
						used_number_pieces_arr_for_current_level = LevelControl.getGivenNumbersArrForCurrentLevel(current_level_id);
						localStorage.setItem("SudokuOnline.used_number_pieces_arr_for_"+current_level_id, used_number_pieces_arr_for_current_level.toString());
					} else {
						// if there is corresponding data stored in localStorage
						stored_used_number_pieces_arr_for_current_level = stored_data.split(",");
						// first initialize the used number pieces array for this level to only store the given numbers for this
						// level (and to store 0's for in all other indices where there is not a given number); after determining
						// that data from local storage is not corrupted, then reassign it the data from local storage
						used_number_pieces_arr_for_current_level = LevelControl.getGivenNumbersArrForCurrentLevel(current_level_id);

						if(dataFromLocalStorageAppearsUncorrupted(stored_used_number_pieces_arr_for_current_level, used_number_pieces_arr_for_current_level)) {
							// if data from local storage appears to not be corrupted, set it as the used number pieces array
							// for this level
							used_number_pieces_arr_for_current_level = stored_used_number_pieces_arr_for_current_level.map(Number);
							checkIfLevelWasCompletedInAPreviousSession(current_level_id, used_number_pieces_arr_for_current_level);
						} else {
							// if data from local storage is corrupted, replace corrupted data in local storage
							localStorage.setItem("SudokuOnline.used_number_pieces_arr_for_"+current_level_id, used_number_pieces_arr_for_current_level.toString());
						}
					}
					// set used number pieces array for current level
					LevelControl.setUsedNumberPiecesArrForCurrentLevel(current_level_id, used_number_pieces_arr_for_current_level);
				}
		}

		function initializeUsedNumberPiecesArraysAsGivenNumbers() {
			var current_level_id,
				used_number_pieces_arr_for_current_level;
			
			for(var i = 1; i <= NUM_LEVELS; i++) {
				current_level_id = "level_"+i;
				used_number_pieces_arr_for_current_level = LevelControl.getGivenNumbersArrForCurrentLevel(current_level_id);
				LevelControl.setUsedNumberPiecesArrForCurrentLevel(current_level_id, used_number_pieces_arr_for_current_level);
			}
		}

		function dataFromLocalStorageAppearsUncorrupted(stored_used_number_pieces_arr_for_current_level, used_number_pieces_arr_for_current_level) {
			if(arrayOnlyContainsNumbers(stored_used_number_pieces_arr_for_current_level) && 
				stored_used_number_pieces_arr_for_current_level.length == 81 && 
				dataFromLocalStorageHasGivenNumbersInCorrectIndices(stored_used_number_pieces_arr_for_current_level, used_number_pieces_arr_for_current_level)) {
				return true;
			}
			return false;
		}

		function dataFromLocalStorageHasGivenNumbersInCorrectIndices(stored_used_number_pieces_arr_for_current_level, used_number_pieces_arr_for_current_level) {
			for(var i = 0; i < used_number_pieces_arr_for_current_level.length; i++) {
				if(used_number_pieces_arr_for_current_level[i] != 0) {
					// used_number_pieces_arr_for_current_level stores only the given numbers
					// for the current level (see initializeUsedNumberPiecesArraysFromDataInLocalStorage
					// function for where it was set before being passed in here as a parameter);
					// if the ith index of this array is not 0, then this index stores a given number,
					// so cross-check to see that the ith index of stored_used_number_pieces_arr_for_current_level
					// also stores the same number, or else the data stored in local storage for this level
					// has been corrupted (since given numbers cannot be altered by the player)
					if(used_number_pieces_arr_for_current_level[i] != stored_used_number_pieces_arr_for_current_level[i]) {
						return false;
					}
				}
			}
			return true;
		}

		function checkIfLevelWasCompletedInAPreviousSession(current_level_id, used_number_pieces_arr_for_current_level) {
			if($.inArray(0, used_number_pieces_arr_for_current_level) == -1) {
				$("#"+current_level_id).removeClass("incomplete_level");
				$("#"+current_level_id).addClass("completed_level");
			}
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
			attachEventHandlerForNavigationPanelTextInputBoxItems();
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
		function attachEventHandlerForNavigationPanelTextInputBoxItems() {
			$("#navigation_panel_text_input_box_wrapper").bind({
				mouseover : function() {
					$("#navigation_panel_text_input_box_hint").css({left: "100px"});
				},
				mouseout : function() {
					$("#navigation_panel_text_input_box_hint").css({left: "-99999px"});	
				}
			});
			$("#navigation_panel_text_input_box").bind({
				keypress : function(event) {
					LevelControl.checkTextInput(event);
				},
				mouseover : function() {
					$("#navigation_panel_text_input_box_hint").css({left: "100px"});
				},
				mouseout : function() {
					$("#navigation_panel_text_input_box_hint").css({left: "-99999px"});	
				}
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
		var GAME_BOARD_LENGTH = 414,
			GAME_BOARD_TILE_LENGTH = 46,
			game_board_offset_left = 0,
			game_board_offset_top = 0;

		function repositionGameBoardArea() {
			var window_height = $(window).height(),
				window_width = $(window).width();

			// do not allow the game board area to be repositioned horizontally or vertically
			// if the window is resized to a size that is smaller than the minimum allowed width
			// (940px) or the minimum allowed height (550px), respectively
			if(window_height < 550) {
				window_height = 550;
			}
			if(window_width < 940) {
				window_width = 940;
			}

			// position game board
			var game_board_aggregate_border_width = 15,
				offset_to_horizontally_center_game_board_area = 115,
				offset_to_vertically_center_game_board_area = 40;
			game_board_offset_top = (window_height - GAME_BOARD_LENGTH) / 2 - game_board_aggregate_border_width - offset_to_vertically_center_game_board_area;
			game_board_offset_left = (window_width - GAME_BOARD_LENGTH) / 2 + game_board_aggregate_border_width + offset_to_horizontally_center_game_board_area;
			$("#game_board").css({top: game_board_offset_top+"px", bottom: "auto", left: game_board_offset_left+"px", right: "auto"});

			// position unused number pieces panel
			var unused_number_pieces_panel_offset_left = game_board_offset_left + GAME_BOARD_LENGTH + game_board_aggregate_border_width + 10,
				unused_number_pieces_panel_offset_top = game_board_offset_top - 5;
			$("#unused_number_pieces_panel").css({top: unused_number_pieces_panel_offset_top+"px", bottom: "auto", left: unused_number_pieces_panel_offset_left+"px", right: "auto"});

			// position clear board button
			var unused_number_pieces_panel_height_incl_borders = 425,
				clear_board_button_offset_top = unused_number_pieces_panel_offset_top + unused_number_pieces_panel_height_incl_borders + 10;
			$("#clear_board_button").css({top: clear_board_button_offset_top+"px", bottom: "auto", left: unused_number_pieces_panel_offset_left+"px", right: "auto"});
			
			// position information box
			var information_box_width_incl_padding = 270, game_board_left_border_and_margin_width = 20,
				information_box_offset_left = game_board_offset_left - information_box_width_incl_padding - game_board_left_border_and_margin_width;
			$("#information_box").css({top: unused_number_pieces_panel_offset_top+"px", bottom: "auto", left: information_box_offset_left+"px", right: "auto"});

			// position instruction popup button
			var instruction_popup_button_width = 25,
				instruction_popup_button_offset_top = unused_number_pieces_panel_offset_top + 10,
				instruction_popup_button_offset_left = information_box_offset_left + information_box_width_incl_padding - instruction_popup_button_width - 15;
			$("#instruction_popup_button").css({top: instruction_popup_button_offset_top+"px", bottom: "auto", left: instruction_popup_button_offset_left+"px", right: "auto"});
			
			// position instruction popup
			var instruction_popup_offset_left = game_board_offset_left - 13;
			$("#instruction_popup").css({top: unused_number_pieces_panel_offset_top+"px", bottom: "auto", left: instruction_popup_offset_left+"px", right: "auto"});

			// position level loaded display box
			var level_display_box_width_incl_borders = 184,
				level_display_box_offset_top = game_board_offset_top + GAME_BOARD_LENGTH + game_board_aggregate_border_width,
				level_display_box_offset_left = game_board_offset_left + ((GAME_BOARD_LENGTH - level_display_box_width_incl_borders) / 2);
			$("#level_display_box").css({top: level_display_box_offset_top+"px", bottom: "auto", left: level_display_box_offset_left+"px", right: "auto"});
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
			var game_piece_center_x = event.pageX - 15,
				game_piece_center_y = event.pageY - 15;
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
			return Math.ceil((event.pageY - game_board_offset_top) / GAME_BOARD_TILE_LENGTH);
		}

		function getActiveTileColumnNum(event) {
			return Math.ceil((event.pageX - game_board_offset_left) / GAME_BOARD_TILE_LENGTH);
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
		var used_number_pieces_arr_for_level_1,
			used_number_pieces_arr_for_level_2,
			used_number_pieces_arr_for_level_3,
			used_number_pieces_arr_for_level_4,
			used_number_pieces_arr_for_level_5,
			used_number_pieces_arr_for_level_6,
			used_number_pieces_arr_for_level_7,
			used_number_pieces_arr_for_level_8,
			used_number_pieces_arr_for_level_9,
			used_number_pieces_arr_for_level_10,
			used_number_pieces_arr_for_level_11,
			used_number_pieces_arr_for_level_12,
			used_number_pieces_arr_for_level_13,
			used_number_pieces_arr_for_level_14,
			used_number_pieces_arr_for_level_15,
			used_number_pieces_arr_for_level_16,
			used_number_pieces_arr_for_level_17,
			used_number_pieces_arr_for_level_18,
			used_number_pieces_arr_for_level_19,
			used_number_pieces_arr_for_level_20,
			used_number_pieces_arr_for_level_21,
			used_number_pieces_arr_for_level_22,
			used_number_pieces_arr_for_level_23,
			used_number_pieces_arr_for_level_24,
			used_number_pieces_arr_for_level_25,
			used_number_pieces_arr_for_level_26,
			used_number_pieces_arr_for_level_27,
			used_number_pieces_arr_for_level_28,
			used_number_pieces_arr_for_level_29,
			used_number_pieces_arr_for_level_30,
			used_number_pieces_arr_for_level_31,
			used_number_pieces_arr_for_level_32,
			used_number_pieces_arr_for_level_33,
			used_number_pieces_arr_for_level_34,
			used_number_pieces_arr_for_level_35,
			used_number_pieces_arr_for_level_36,
			used_number_pieces_arr_for_level_37,
			used_number_pieces_arr_for_level_38,
			used_number_pieces_arr_for_level_39,
			used_number_pieces_arr_for_level_40,
			used_number_pieces_arr_for_level_41,
			used_number_pieces_arr_for_level_42,
			used_number_pieces_arr_for_level_43,
			used_number_pieces_arr_for_level_44,
			used_number_pieces_arr_for_level_45,
			used_number_pieces_arr_for_level_46,
			used_number_pieces_arr_for_level_47,
			used_number_pieces_arr_for_level_48,
			used_number_pieces_arr_for_level_49,
			used_number_pieces_arr_for_level_50,
			used_number_pieces_arr_for_level_51,
			used_number_pieces_arr_for_level_52,
			used_number_pieces_arr_for_level_53,
			used_number_pieces_arr_for_level_54,
			used_number_pieces_arr_for_level_55,
			used_number_pieces_arr_for_level_56,
			used_number_pieces_arr_for_level_57,
			used_number_pieces_arr_for_level_58,
			used_number_pieces_arr_for_level_59,
			used_number_pieces_arr_for_level_60,
			used_number_pieces_arr_for_level_61,
			used_number_pieces_arr_for_level_62,
			used_number_pieces_arr_for_level_63,
			used_number_pieces_arr_for_level_64,
			used_number_pieces_arr_for_level_65,
			used_number_pieces_arr_for_level_66,
			used_number_pieces_arr_for_level_67,
			used_number_pieces_arr_for_level_68,
			used_number_pieces_arr_for_level_69,
			used_number_pieces_arr_for_level_70,
			used_number_pieces_arr_for_level_71,
			used_number_pieces_arr_for_level_72,
			used_number_pieces_arr_for_level_73,
			used_number_pieces_arr_for_level_74,
			used_number_pieces_arr_for_level_75,
			used_number_pieces_arr_for_level_76,
			used_number_pieces_arr_for_level_77,
			used_number_pieces_arr_for_level_78,
			used_number_pieces_arr_for_level_79,
			used_number_pieces_arr_for_level_80,
			used_number_pieces_arr_for_level_81,
			used_number_pieces_arr_for_level_82,
			used_number_pieces_arr_for_level_83,
			used_number_pieces_arr_for_level_84,
			used_number_pieces_arr_for_level_85,
			used_number_pieces_arr_for_level_86,
			used_number_pieces_arr_for_level_87,
			used_number_pieces_arr_for_level_88,
			used_number_pieces_arr_for_level_89,
			used_number_pieces_arr_for_level_90,
			used_number_pieces_arr_for_level_91,
			used_number_pieces_arr_for_level_92,
			used_number_pieces_arr_for_level_93,
			used_number_pieces_arr_for_level_94,
			used_number_pieces_arr_for_level_95,
			used_number_pieces_arr_for_level_96,
			used_number_pieces_arr_for_level_97,
			used_number_pieces_arr_for_level_98,
			used_number_pieces_arr_for_level_99,
			used_number_pieces_arr_for_level_100,
			used_number_pieces_arr_for_level_101,
			used_number_pieces_arr_for_level_102,
			used_number_pieces_arr_for_level_103,
			used_number_pieces_arr_for_level_104,
			used_number_pieces_arr_for_level_105,
			used_number_pieces_arr_for_level_106,
			used_number_pieces_arr_for_level_107,
			used_number_pieces_arr_for_level_108,
			used_number_pieces_arr_for_level_109,
			used_number_pieces_arr_for_level_110,
			used_number_pieces_arr_for_level_111,
			used_number_pieces_arr_for_level_112,
			used_number_pieces_arr_for_level_113,
			used_number_pieces_arr_for_level_114,
			used_number_pieces_arr_for_level_115,
			used_number_pieces_arr_for_level_116,
			used_number_pieces_arr_for_level_117,
			used_number_pieces_arr_for_level_118,
			used_number_pieces_arr_for_level_119,
			used_number_pieces_arr_for_level_120,
			used_number_pieces_arr_for_level_121,
			used_number_pieces_arr_for_level_122,
			used_number_pieces_arr_for_level_123,
			used_number_pieces_arr_for_level_124,
			used_number_pieces_arr_for_level_125,
			used_number_pieces_arr_for_level_126,
			used_number_pieces_arr_for_level_127,
			used_number_pieces_arr_for_level_128,
			used_number_pieces_arr_for_level_129,
			used_number_pieces_arr_for_level_130,
			used_number_pieces_arr_for_level_131,
			used_number_pieces_arr_for_level_132,
			used_number_pieces_arr_for_level_133,
			used_number_pieces_arr_for_level_134,
			used_number_pieces_arr_for_level_135,
			used_number_pieces_arr_for_level_136,
			used_number_pieces_arr_for_level_137,
			used_number_pieces_arr_for_level_138,
			used_number_pieces_arr_for_level_139,
			used_number_pieces_arr_for_level_140,
			used_number_pieces_arr_for_level_141,
			used_number_pieces_arr_for_level_142,
			used_number_pieces_arr_for_level_143,
			used_number_pieces_arr_for_level_144,
			used_number_pieces_arr_for_level_145,
			used_number_pieces_arr_for_level_146,
			used_number_pieces_arr_for_level_147,
			used_number_pieces_arr_for_level_148,
			used_number_pieces_arr_for_level_149,
			used_number_pieces_arr_for_level_150,
			used_number_pieces_arr_for_level_151,
			used_number_pieces_arr_for_level_152,
			used_number_pieces_arr_for_level_153,
			used_number_pieces_arr_for_level_154,
			used_number_pieces_arr_for_level_155,
			used_number_pieces_arr_for_level_156,
			used_number_pieces_arr_for_level_157,
			used_number_pieces_arr_for_level_158,
			used_number_pieces_arr_for_level_159,
			used_number_pieces_arr_for_level_160,
			used_number_pieces_arr_for_level_161,
			used_number_pieces_arr_for_level_162,
			used_number_pieces_arr_for_level_163,
			used_number_pieces_arr_for_level_164,
			used_number_pieces_arr_for_level_165,
			used_number_pieces_arr_for_level_166,
			used_number_pieces_arr_for_level_167,
			used_number_pieces_arr_for_level_168,
			used_number_pieces_arr_for_level_169,
			used_number_pieces_arr_for_level_170,
			used_number_pieces_arr_for_level_171,
			used_number_pieces_arr_for_level_172,
			used_number_pieces_arr_for_level_173,
			used_number_pieces_arr_for_level_174,
			used_number_pieces_arr_for_level_175,
			used_number_pieces_arr_for_level_176,
			used_number_pieces_arr_for_level_177,
			used_number_pieces_arr_for_level_178,
			used_number_pieces_arr_for_level_179,
			used_number_pieces_arr_for_level_180,
			used_number_pieces_arr_for_level_181,
			used_number_pieces_arr_for_level_182,
			used_number_pieces_arr_for_level_183,
			used_number_pieces_arr_for_level_184,
			used_number_pieces_arr_for_level_185,
			used_number_pieces_arr_for_level_186,
			used_number_pieces_arr_for_level_187,
			used_number_pieces_arr_for_level_188,
			used_number_pieces_arr_for_level_189,
			used_number_pieces_arr_for_level_190,
			used_number_pieces_arr_for_level_191,
			used_number_pieces_arr_for_level_192,
			used_number_pieces_arr_for_level_193,
			used_number_pieces_arr_for_level_194,
			used_number_pieces_arr_for_level_195,
			used_number_pieces_arr_for_level_196,
			used_number_pieces_arr_for_level_197,
			used_number_pieces_arr_for_level_198,
			used_number_pieces_arr_for_level_199,
			used_number_pieces_arr_for_level_200,
			used_number_pieces_arr_for_level_201,
			used_number_pieces_arr_for_level_202,
			used_number_pieces_arr_for_level_203,
			used_number_pieces_arr_for_level_204,
			used_number_pieces_arr_for_level_205,
			used_number_pieces_arr_for_level_206,
			used_number_pieces_arr_for_level_207,
			used_number_pieces_arr_for_level_208,
			used_number_pieces_arr_for_level_209,
			used_number_pieces_arr_for_level_210,
			used_number_pieces_arr_for_level_211,
			used_number_pieces_arr_for_level_212,
			used_number_pieces_arr_for_level_213,
			used_number_pieces_arr_for_level_214,
			used_number_pieces_arr_for_level_215,
			used_number_pieces_arr_for_level_216,
			used_number_pieces_arr_for_level_217,
			used_number_pieces_arr_for_level_218,
			used_number_pieces_arr_for_level_219,
			used_number_pieces_arr_for_level_220,
			used_number_pieces_arr_for_level_221,
			used_number_pieces_arr_for_level_222,
			used_number_pieces_arr_for_level_223,
			used_number_pieces_arr_for_level_224,
			used_number_pieces_arr_for_level_225,
			used_number_pieces_arr_for_level_226,
			used_number_pieces_arr_for_level_227,
			used_number_pieces_arr_for_level_228,
			used_number_pieces_arr_for_level_229,
			used_number_pieces_arr_for_level_230,
			used_number_pieces_arr_for_level_231,
			used_number_pieces_arr_for_level_232,
			used_number_pieces_arr_for_level_233,
			used_number_pieces_arr_for_level_234,
			used_number_pieces_arr_for_level_235,
			used_number_pieces_arr_for_level_236,
			used_number_pieces_arr_for_level_237,
			used_number_pieces_arr_for_level_238,
			used_number_pieces_arr_for_level_239,
			used_number_pieces_arr_for_level_240,
			used_number_pieces_arr_for_level_241,
			used_number_pieces_arr_for_level_242,
			used_number_pieces_arr_for_level_243,
			used_number_pieces_arr_for_level_244,
			used_number_pieces_arr_for_level_245,
			used_number_pieces_arr_for_level_246,
			used_number_pieces_arr_for_level_247,
			used_number_pieces_arr_for_level_248,
			used_number_pieces_arr_for_level_249,
			used_number_pieces_arr_for_level_250,
			used_number_pieces_arr_for_level_251,
			used_number_pieces_arr_for_level_252,
			used_number_pieces_arr_for_level_253,
			used_number_pieces_arr_for_level_254,
			used_number_pieces_arr_for_level_255,
			used_number_pieces_arr_for_level_256,
			used_number_pieces_arr_for_level_257,
			used_number_pieces_arr_for_level_258,
			used_number_pieces_arr_for_level_259,
			used_number_pieces_arr_for_level_260,
			used_number_pieces_arr_for_level_261,
			used_number_pieces_arr_for_level_262,
			used_number_pieces_arr_for_level_263,
			used_number_pieces_arr_for_level_264,
			used_number_pieces_arr_for_level_265,
			used_number_pieces_arr_for_level_266,
			used_number_pieces_arr_for_level_267,
			used_number_pieces_arr_for_level_268,
			used_number_pieces_arr_for_level_269,
			used_number_pieces_arr_for_level_270,
			used_number_pieces_arr_for_level_271,
			used_number_pieces_arr_for_level_272,
			used_number_pieces_arr_for_level_273,
			used_number_pieces_arr_for_level_274,
			used_number_pieces_arr_for_level_275,
			used_number_pieces_arr_for_level_276,
			used_number_pieces_arr_for_level_277,
			used_number_pieces_arr_for_level_278,
			used_number_pieces_arr_for_level_279,
			used_number_pieces_arr_for_level_280,
			used_number_pieces_arr_for_level_281,
			used_number_pieces_arr_for_level_282,
			used_number_pieces_arr_for_level_283,
			used_number_pieces_arr_for_level_284,
			used_number_pieces_arr_for_level_285,
			used_number_pieces_arr_for_level_286,
			used_number_pieces_arr_for_level_287,
			used_number_pieces_arr_for_level_288,
			used_number_pieces_arr_for_level_289,
			used_number_pieces_arr_for_level_290,
			used_number_pieces_arr_for_level_291,
			used_number_pieces_arr_for_level_292,
			used_number_pieces_arr_for_level_293,
			used_number_pieces_arr_for_level_294,
			used_number_pieces_arr_for_level_295,
			used_number_pieces_arr_for_level_296,
			used_number_pieces_arr_for_level_297,
			used_number_pieces_arr_for_level_298,
			used_number_pieces_arr_for_level_299,
			used_number_pieces_arr_for_level_300,
			used_number_pieces_arr_for_level_301,
			used_number_pieces_arr_for_level_302,
			used_number_pieces_arr_for_level_303,
			used_number_pieces_arr_for_level_304,
			used_number_pieces_arr_for_level_305,
			used_number_pieces_arr_for_level_306,
			used_number_pieces_arr_for_level_307,
			used_number_pieces_arr_for_level_308,
			used_number_pieces_arr_for_level_309,
			used_number_pieces_arr_for_level_310,
			used_number_pieces_arr_for_level_311,
			used_number_pieces_arr_for_level_312,
			used_number_pieces_arr_for_level_313,
			used_number_pieces_arr_for_level_314,
			used_number_pieces_arr_for_level_315,
			used_number_pieces_arr_for_level_316,
			used_number_pieces_arr_for_level_317,
			used_number_pieces_arr_for_level_318,
			used_number_pieces_arr_for_level_319,
			used_number_pieces_arr_for_level_320,
			used_number_pieces_arr_for_level_321,
			used_number_pieces_arr_for_level_322,
			used_number_pieces_arr_for_level_323,
			used_number_pieces_arr_for_level_324,
			used_number_pieces_arr_for_level_325,
			used_number_pieces_arr_for_level_326,
			used_number_pieces_arr_for_level_327,
			used_number_pieces_arr_for_level_328,
			used_number_pieces_arr_for_level_329,
			used_number_pieces_arr_for_level_330,
			used_number_pieces_arr_for_level_331,
			used_number_pieces_arr_for_level_332,
			used_number_pieces_arr_for_level_333,
			used_number_pieces_arr_for_level_334,
			used_number_pieces_arr_for_level_335,
			used_number_pieces_arr_for_level_336,
			used_number_pieces_arr_for_level_337,
			used_number_pieces_arr_for_level_338,
			used_number_pieces_arr_for_level_339,
			used_number_pieces_arr_for_level_340,
			used_number_pieces_arr_for_level_341,
			used_number_pieces_arr_for_level_342,
			used_number_pieces_arr_for_level_343,
			used_number_pieces_arr_for_level_344,
			used_number_pieces_arr_for_level_345,
			used_number_pieces_arr_for_level_346,
			used_number_pieces_arr_for_level_347,
			used_number_pieces_arr_for_level_348,
			used_number_pieces_arr_for_level_349,
			used_number_pieces_arr_for_level_350,
			used_number_pieces_arr_for_level_351,
			used_number_pieces_arr_for_level_352,
			used_number_pieces_arr_for_level_353,
			used_number_pieces_arr_for_level_354,
			used_number_pieces_arr_for_level_355,
			used_number_pieces_arr_for_level_356,
			used_number_pieces_arr_for_level_357,
			used_number_pieces_arr_for_level_358,
			used_number_pieces_arr_for_level_359,
			used_number_pieces_arr_for_level_360,
			used_number_pieces_arr_for_level_361,
			used_number_pieces_arr_for_level_362,
			used_number_pieces_arr_for_level_363,
			used_number_pieces_arr_for_level_364,
			used_number_pieces_arr_for_level_365,
			used_number_pieces_arr_for_level_366,
			used_number_pieces_arr_for_level_367,
			used_number_pieces_arr_for_level_368,
			used_number_pieces_arr_for_level_369,
			used_number_pieces_arr_for_level_370,
			used_number_pieces_arr_for_level_371,
			used_number_pieces_arr_for_level_372,
			used_number_pieces_arr_for_level_373,
			used_number_pieces_arr_for_level_374,
			used_number_pieces_arr_for_level_375,
			used_number_pieces_arr_for_level_376,
			used_number_pieces_arr_for_level_377,
			used_number_pieces_arr_for_level_378,
			used_number_pieces_arr_for_level_379,
			used_number_pieces_arr_for_level_380,
			used_number_pieces_arr_for_level_381,
			used_number_pieces_arr_for_level_382,
			used_number_pieces_arr_for_level_383,
			used_number_pieces_arr_for_level_384,
			used_number_pieces_arr_for_level_385,
			used_number_pieces_arr_for_level_386,
			used_number_pieces_arr_for_level_387,
			used_number_pieces_arr_for_level_388,
			used_number_pieces_arr_for_level_389,
			used_number_pieces_arr_for_level_390,
			used_number_pieces_arr_for_level_391,
			used_number_pieces_arr_for_level_392,
			used_number_pieces_arr_for_level_393,
			used_number_pieces_arr_for_level_394,
			used_number_pieces_arr_for_level_395,
			used_number_pieces_arr_for_level_396,
			used_number_pieces_arr_for_level_397,
			used_number_pieces_arr_for_level_398,
			used_number_pieces_arr_for_level_399,
			used_number_pieces_arr_for_level_400,
			used_number_pieces_arr_for_level_401,
			used_number_pieces_arr_for_level_402,
			used_number_pieces_arr_for_level_403,
			used_number_pieces_arr_for_level_404,
			used_number_pieces_arr_for_level_405,
			used_number_pieces_arr_for_level_406,
			used_number_pieces_arr_for_level_407,
			used_number_pieces_arr_for_level_408,
			used_number_pieces_arr_for_level_409,
			used_number_pieces_arr_for_level_410,
			used_number_pieces_arr_for_level_411,
			used_number_pieces_arr_for_level_412,
			used_number_pieces_arr_for_level_413,
			used_number_pieces_arr_for_level_414,
			used_number_pieces_arr_for_level_415,
			used_number_pieces_arr_for_level_416,
			used_number_pieces_arr_for_level_417,
			used_number_pieces_arr_for_level_418,
			used_number_pieces_arr_for_level_419,
			used_number_pieces_arr_for_level_420,
			used_number_pieces_arr_for_level_421,
			used_number_pieces_arr_for_level_422,
			used_number_pieces_arr_for_level_423,
			used_number_pieces_arr_for_level_424,
			used_number_pieces_arr_for_level_425,
			used_number_pieces_arr_for_level_426,
			used_number_pieces_arr_for_level_427,
			used_number_pieces_arr_for_level_428,
			used_number_pieces_arr_for_level_429,
			used_number_pieces_arr_for_level_430,
			used_number_pieces_arr_for_level_431,
			used_number_pieces_arr_for_level_432,
			used_number_pieces_arr_for_level_433,
			used_number_pieces_arr_for_level_434,
			used_number_pieces_arr_for_level_435,
			used_number_pieces_arr_for_level_436,
			used_number_pieces_arr_for_level_437,
			used_number_pieces_arr_for_level_438,
			used_number_pieces_arr_for_level_439,
			used_number_pieces_arr_for_level_440,
			used_number_pieces_arr_for_level_441,
			used_number_pieces_arr_for_level_442,
			used_number_pieces_arr_for_level_443,
			used_number_pieces_arr_for_level_444,
			used_number_pieces_arr_for_level_445,
			used_number_pieces_arr_for_level_446,
			used_number_pieces_arr_for_level_447,
			used_number_pieces_arr_for_level_448,
			used_number_pieces_arr_for_level_449,
			used_number_pieces_arr_for_level_450,
			used_number_pieces_arr_for_level_451,
			used_number_pieces_arr_for_level_452,
			used_number_pieces_arr_for_level_453,
			used_number_pieces_arr_for_level_454,
			used_number_pieces_arr_for_level_455,
			used_number_pieces_arr_for_level_456,
			used_number_pieces_arr_for_level_457,
			used_number_pieces_arr_for_level_458,
			used_number_pieces_arr_for_level_459,
			used_number_pieces_arr_for_level_460,
			used_number_pieces_arr_for_level_461,
			used_number_pieces_arr_for_level_462,
			used_number_pieces_arr_for_level_463,
			used_number_pieces_arr_for_level_464,
			used_number_pieces_arr_for_level_465,
			used_number_pieces_arr_for_level_466,
			used_number_pieces_arr_for_level_467,
			used_number_pieces_arr_for_level_468,
			used_number_pieces_arr_for_level_469,
			used_number_pieces_arr_for_level_470,
			used_number_pieces_arr_for_level_471,
			used_number_pieces_arr_for_level_472,
			used_number_pieces_arr_for_level_473,
			used_number_pieces_arr_for_level_474,
			used_number_pieces_arr_for_level_475,
			used_number_pieces_arr_for_level_476,
			used_number_pieces_arr_for_level_477,
			used_number_pieces_arr_for_level_478,
			used_number_pieces_arr_for_level_479,
			used_number_pieces_arr_for_level_480,
			used_number_pieces_arr_for_level_481,
			used_number_pieces_arr_for_level_482,
			used_number_pieces_arr_for_level_483,
			used_number_pieces_arr_for_level_484,
			used_number_pieces_arr_for_level_485,
			used_number_pieces_arr_for_level_486,
			used_number_pieces_arr_for_level_487,
			used_number_pieces_arr_for_level_488,
			used_number_pieces_arr_for_level_489,
			used_number_pieces_arr_for_level_490,
			used_number_pieces_arr_for_level_491,
			used_number_pieces_arr_for_level_492,
			used_number_pieces_arr_for_level_493,
			used_number_pieces_arr_for_level_494,
			used_number_pieces_arr_for_level_495,
			used_number_pieces_arr_for_level_496,
			used_number_pieces_arr_for_level_497,
			used_number_pieces_arr_for_level_498,
			used_number_pieces_arr_for_level_499,
			used_number_pieces_arr_for_level_500,
			used_number_pieces_arr_for_level_501,
			used_number_pieces_arr_for_level_502,
			used_number_pieces_arr_for_level_503,
			used_number_pieces_arr_for_level_504,
			used_number_pieces_arr_for_level_505,
			used_number_pieces_arr_for_level_506,
			used_number_pieces_arr_for_level_507,
			used_number_pieces_arr_for_level_508,
			used_number_pieces_arr_for_level_509,
			used_number_pieces_arr_for_level_510,
			used_number_pieces_arr_for_level_511,
			used_number_pieces_arr_for_level_512,
			used_number_pieces_arr_for_level_513,
			used_number_pieces_arr_for_level_514,
			used_number_pieces_arr_for_level_515,
			used_number_pieces_arr_for_level_516,
			used_number_pieces_arr_for_level_517,
			used_number_pieces_arr_for_level_518,
			used_number_pieces_arr_for_level_519,
			used_number_pieces_arr_for_level_520,
			used_number_pieces_arr_for_level_521,
			used_number_pieces_arr_for_level_522,
			used_number_pieces_arr_for_level_523,
			used_number_pieces_arr_for_level_524,
			used_number_pieces_arr_for_level_525,
			used_number_pieces_arr_for_level_526,
			used_number_pieces_arr_for_level_527,
			used_number_pieces_arr_for_level_528,
			used_number_pieces_arr_for_level_529,
			used_number_pieces_arr_for_level_530,
			used_number_pieces_arr_for_level_531,
			used_number_pieces_arr_for_level_532,
			used_number_pieces_arr_for_level_533,
			used_number_pieces_arr_for_level_534,
			used_number_pieces_arr_for_level_535,
			used_number_pieces_arr_for_level_536,
			used_number_pieces_arr_for_level_537,
			used_number_pieces_arr_for_level_538,
			used_number_pieces_arr_for_level_539,
			used_number_pieces_arr_for_level_540,
			used_number_pieces_arr_for_level_541,
			used_number_pieces_arr_for_level_542,
			used_number_pieces_arr_for_level_543,
			used_number_pieces_arr_for_level_544,
			used_number_pieces_arr_for_level_545,
			used_number_pieces_arr_for_level_546,
			used_number_pieces_arr_for_level_547,
			used_number_pieces_arr_for_level_548,
			used_number_pieces_arr_for_level_549,
			used_number_pieces_arr_for_level_550,
			used_number_pieces_arr_for_level_551,
			used_number_pieces_arr_for_level_552,
			used_number_pieces_arr_for_level_553,
			used_number_pieces_arr_for_level_554,
			used_number_pieces_arr_for_level_555,
			used_number_pieces_arr_for_level_556,
			used_number_pieces_arr_for_level_557,
			used_number_pieces_arr_for_level_558,
			used_number_pieces_arr_for_level_559,
			used_number_pieces_arr_for_level_560,
			used_number_pieces_arr_for_level_561,
			used_number_pieces_arr_for_level_562,
			used_number_pieces_arr_for_level_563,
			used_number_pieces_arr_for_level_564,
			used_number_pieces_arr_for_level_565,
			used_number_pieces_arr_for_level_566,
			used_number_pieces_arr_for_level_567,
			used_number_pieces_arr_for_level_568,
			used_number_pieces_arr_for_level_569,
			used_number_pieces_arr_for_level_570,
			used_number_pieces_arr_for_level_571,
			used_number_pieces_arr_for_level_572,
			used_number_pieces_arr_for_level_573,
			used_number_pieces_arr_for_level_574,
			used_number_pieces_arr_for_level_575,
			used_number_pieces_arr_for_level_576,
			used_number_pieces_arr_for_level_577,
			used_number_pieces_arr_for_level_578,
			used_number_pieces_arr_for_level_579,
			used_number_pieces_arr_for_level_580,
			used_number_pieces_arr_for_level_581,
			used_number_pieces_arr_for_level_582,
			used_number_pieces_arr_for_level_583,
			used_number_pieces_arr_for_level_584,
			used_number_pieces_arr_for_level_585,
			used_number_pieces_arr_for_level_586,
			used_number_pieces_arr_for_level_587,
			used_number_pieces_arr_for_level_588,
			used_number_pieces_arr_for_level_589,
			used_number_pieces_arr_for_level_590,
			used_number_pieces_arr_for_level_591,
			used_number_pieces_arr_for_level_592,
			used_number_pieces_arr_for_level_593,
			used_number_pieces_arr_for_level_594,
			used_number_pieces_arr_for_level_595,
			used_number_pieces_arr_for_level_596,
			used_number_pieces_arr_for_level_597,
			used_number_pieces_arr_for_level_598,
			used_number_pieces_arr_for_level_599,
			used_number_pieces_arr_for_level_600,
			used_number_pieces_arr_for_level_601,
			used_number_pieces_arr_for_level_602,
			used_number_pieces_arr_for_level_603,
			used_number_pieces_arr_for_level_604,
			used_number_pieces_arr_for_level_605,
			used_number_pieces_arr_for_level_606,
			used_number_pieces_arr_for_level_607,
			used_number_pieces_arr_for_level_608,
			used_number_pieces_arr_for_level_609,
			used_number_pieces_arr_for_level_610,
			used_number_pieces_arr_for_level_611,
			used_number_pieces_arr_for_level_612,
			used_number_pieces_arr_for_level_613,
			used_number_pieces_arr_for_level_614,
			used_number_pieces_arr_for_level_615,
			used_number_pieces_arr_for_level_616,
			used_number_pieces_arr_for_level_617,
			used_number_pieces_arr_for_level_618,
			used_number_pieces_arr_for_level_619,
			used_number_pieces_arr_for_level_620,
			used_number_pieces_arr_for_level_621,
			used_number_pieces_arr_for_level_622,
			used_number_pieces_arr_for_level_623,
			used_number_pieces_arr_for_level_624,
			used_number_pieces_arr_for_level_625,
			used_number_pieces_arr_for_level_626,
			used_number_pieces_arr_for_level_627,
			used_number_pieces_arr_for_level_628,
			used_number_pieces_arr_for_level_629,
			used_number_pieces_arr_for_level_630,
			used_number_pieces_arr_for_level_631,
			used_number_pieces_arr_for_level_632,
			used_number_pieces_arr_for_level_633,
			used_number_pieces_arr_for_level_634,
			used_number_pieces_arr_for_level_635,
			used_number_pieces_arr_for_level_636,
			used_number_pieces_arr_for_level_637,
			used_number_pieces_arr_for_level_638,
			used_number_pieces_arr_for_level_639,
			used_number_pieces_arr_for_level_640,
			used_number_pieces_arr_for_level_641,
			used_number_pieces_arr_for_level_642,
			used_number_pieces_arr_for_level_643,
			used_number_pieces_arr_for_level_644,
			used_number_pieces_arr_for_level_645,
			used_number_pieces_arr_for_level_646,
			used_number_pieces_arr_for_level_647,
			used_number_pieces_arr_for_level_648,
			used_number_pieces_arr_for_level_649,
			used_number_pieces_arr_for_level_650,
			used_number_pieces_arr_for_level_651,
			used_number_pieces_arr_for_level_652,
			used_number_pieces_arr_for_level_653,
			used_number_pieces_arr_for_level_654,
			used_number_pieces_arr_for_level_655,
			used_number_pieces_arr_for_level_656,
			used_number_pieces_arr_for_level_657,
			used_number_pieces_arr_for_level_658,
			used_number_pieces_arr_for_level_659,
			used_number_pieces_arr_for_level_660,
			used_number_pieces_arr_for_level_661,
			used_number_pieces_arr_for_level_662,
			used_number_pieces_arr_for_level_663,
			used_number_pieces_arr_for_level_664,
			used_number_pieces_arr_for_level_665,
			used_number_pieces_arr_for_level_666,
			used_number_pieces_arr_for_level_667,
			used_number_pieces_arr_for_level_668,
			used_number_pieces_arr_for_level_669,
			used_number_pieces_arr_for_level_670,
			used_number_pieces_arr_for_level_671,
			used_number_pieces_arr_for_level_672,
			used_number_pieces_arr_for_level_673,
			used_number_pieces_arr_for_level_674,
			used_number_pieces_arr_for_level_675,
			used_number_pieces_arr_for_level_676,
			used_number_pieces_arr_for_level_677,
			used_number_pieces_arr_for_level_678,
			used_number_pieces_arr_for_level_679,
			used_number_pieces_arr_for_level_680,
			used_number_pieces_arr_for_level_681,
			used_number_pieces_arr_for_level_682,
			used_number_pieces_arr_for_level_683,
			used_number_pieces_arr_for_level_684,
			used_number_pieces_arr_for_level_685,
			used_number_pieces_arr_for_level_686,
			used_number_pieces_arr_for_level_687,
			used_number_pieces_arr_for_level_688,
			used_number_pieces_arr_for_level_689,
			used_number_pieces_arr_for_level_690,
			used_number_pieces_arr_for_level_691,
			used_number_pieces_arr_for_level_692,
			used_number_pieces_arr_for_level_693,
			used_number_pieces_arr_for_level_694,
			used_number_pieces_arr_for_level_695,
			used_number_pieces_arr_for_level_696,
			used_number_pieces_arr_for_level_697,
			used_number_pieces_arr_for_level_698,
			used_number_pieces_arr_for_level_699,
			used_number_pieces_arr_for_level_700,
			used_number_pieces_arr_for_level_701,
			used_number_pieces_arr_for_level_702,
			used_number_pieces_arr_for_level_703,
			used_number_pieces_arr_for_level_704,
			used_number_pieces_arr_for_level_705,
			used_number_pieces_arr_for_level_706,
			used_number_pieces_arr_for_level_707,
			used_number_pieces_arr_for_level_708,
			used_number_pieces_arr_for_level_709,
			used_number_pieces_arr_for_level_710,
			used_number_pieces_arr_for_level_711,
			used_number_pieces_arr_for_level_712,
			used_number_pieces_arr_for_level_713,
			used_number_pieces_arr_for_level_714,
			used_number_pieces_arr_for_level_715,
			used_number_pieces_arr_for_level_716,
			used_number_pieces_arr_for_level_717,
			used_number_pieces_arr_for_level_718,
			used_number_pieces_arr_for_level_719,
			used_number_pieces_arr_for_level_720,
			used_number_pieces_arr_for_level_721,
			used_number_pieces_arr_for_level_722,
			used_number_pieces_arr_for_level_723,
			used_number_pieces_arr_for_level_724,
			used_number_pieces_arr_for_level_725,
			used_number_pieces_arr_for_level_726,
			used_number_pieces_arr_for_level_727,
			used_number_pieces_arr_for_level_728,
			used_number_pieces_arr_for_level_729,
			used_number_pieces_arr_for_level_730,
			used_number_pieces_arr_for_level_731,
			used_number_pieces_arr_for_level_732,
			used_number_pieces_arr_for_level_733,
			used_number_pieces_arr_for_level_734,
			used_number_pieces_arr_for_level_735,
			used_number_pieces_arr_for_level_736,
			used_number_pieces_arr_for_level_737,
			used_number_pieces_arr_for_level_738,
			used_number_pieces_arr_for_level_739,
			used_number_pieces_arr_for_level_740,
			used_number_pieces_arr_for_level_741,
			used_number_pieces_arr_for_level_742,
			used_number_pieces_arr_for_level_743,
			used_number_pieces_arr_for_level_744,
			used_number_pieces_arr_for_level_745,
			used_number_pieces_arr_for_level_746,
			used_number_pieces_arr_for_level_747,
			used_number_pieces_arr_for_level_748,
			used_number_pieces_arr_for_level_749,
			used_number_pieces_arr_for_level_750,
			used_number_pieces_arr_for_level_751,
			used_number_pieces_arr_for_level_752,
			used_number_pieces_arr_for_level_753,
			used_number_pieces_arr_for_level_754,
			used_number_pieces_arr_for_level_755,
			used_number_pieces_arr_for_level_756,
			used_number_pieces_arr_for_level_757,
			used_number_pieces_arr_for_level_758,
			used_number_pieces_arr_for_level_759,
			used_number_pieces_arr_for_level_760,
			used_number_pieces_arr_for_level_761,
			used_number_pieces_arr_for_level_762,
			used_number_pieces_arr_for_level_763,
			used_number_pieces_arr_for_level_764,
			used_number_pieces_arr_for_level_765,
			used_number_pieces_arr_for_level_766,
			used_number_pieces_arr_for_level_767,
			used_number_pieces_arr_for_level_768,
			used_number_pieces_arr_for_level_769,
			used_number_pieces_arr_for_level_770,
			used_number_pieces_arr_for_level_771,
			used_number_pieces_arr_for_level_772,
			used_number_pieces_arr_for_level_773,
			used_number_pieces_arr_for_level_774,
			used_number_pieces_arr_for_level_775,
			used_number_pieces_arr_for_level_776,
			used_number_pieces_arr_for_level_777,
			used_number_pieces_arr_for_level_778,
			used_number_pieces_arr_for_level_779,
			used_number_pieces_arr_for_level_780,
			used_number_pieces_arr_for_level_781,
			used_number_pieces_arr_for_level_782,
			used_number_pieces_arr_for_level_783,
			used_number_pieces_arr_for_level_784,
			used_number_pieces_arr_for_level_785,
			used_number_pieces_arr_for_level_786,
			used_number_pieces_arr_for_level_787,
			used_number_pieces_arr_for_level_788,
			used_number_pieces_arr_for_level_789,
			used_number_pieces_arr_for_level_790,
			used_number_pieces_arr_for_level_791,
			used_number_pieces_arr_for_level_792,
			used_number_pieces_arr_for_level_793,
			used_number_pieces_arr_for_level_794,
			used_number_pieces_arr_for_level_795,
			used_number_pieces_arr_for_level_796,
			used_number_pieces_arr_for_level_797,
			used_number_pieces_arr_for_level_798,
			used_number_pieces_arr_for_level_799,
			used_number_pieces_arr_for_level_800,
			used_number_pieces_arr_for_level_801,
			used_number_pieces_arr_for_level_802,
			used_number_pieces_arr_for_level_803,
			used_number_pieces_arr_for_level_804,
			used_number_pieces_arr_for_level_805,
			used_number_pieces_arr_for_level_806,
			used_number_pieces_arr_for_level_807,
			used_number_pieces_arr_for_level_808,
			used_number_pieces_arr_for_level_809,
			used_number_pieces_arr_for_level_810,
			used_number_pieces_arr_for_level_811,
			used_number_pieces_arr_for_level_812,
			used_number_pieces_arr_for_level_813,
			used_number_pieces_arr_for_level_814,
			used_number_pieces_arr_for_level_815,
			used_number_pieces_arr_for_level_816,
			used_number_pieces_arr_for_level_817,
			used_number_pieces_arr_for_level_818,
			used_number_pieces_arr_for_level_819,
			used_number_pieces_arr_for_level_820,
			used_number_pieces_arr_for_level_821,
			used_number_pieces_arr_for_level_822,
			used_number_pieces_arr_for_level_823,
			used_number_pieces_arr_for_level_824,
			used_number_pieces_arr_for_level_825,
			used_number_pieces_arr_for_level_826,
			used_number_pieces_arr_for_level_827,
			used_number_pieces_arr_for_level_828,
			used_number_pieces_arr_for_level_829,
			used_number_pieces_arr_for_level_830,
			used_number_pieces_arr_for_level_831,
			used_number_pieces_arr_for_level_832,
			used_number_pieces_arr_for_level_833,
			used_number_pieces_arr_for_level_834,
			used_number_pieces_arr_for_level_835,
			used_number_pieces_arr_for_level_836,
			used_number_pieces_arr_for_level_837,
			used_number_pieces_arr_for_level_838,
			used_number_pieces_arr_for_level_839,
			used_number_pieces_arr_for_level_840,
			used_number_pieces_arr_for_level_841,
			used_number_pieces_arr_for_level_842,
			used_number_pieces_arr_for_level_843,
			used_number_pieces_arr_for_level_844,
			used_number_pieces_arr_for_level_845,
			used_number_pieces_arr_for_level_846,
			used_number_pieces_arr_for_level_847,
			used_number_pieces_arr_for_level_848,
			used_number_pieces_arr_for_level_849,
			used_number_pieces_arr_for_level_850,
			used_number_pieces_arr_for_level_851,
			used_number_pieces_arr_for_level_852,
			used_number_pieces_arr_for_level_853,
			used_number_pieces_arr_for_level_854,
			used_number_pieces_arr_for_level_855,
			used_number_pieces_arr_for_level_856,
			used_number_pieces_arr_for_level_857,
			used_number_pieces_arr_for_level_858,
			used_number_pieces_arr_for_level_859,
			used_number_pieces_arr_for_level_860,
			used_number_pieces_arr_for_level_861,
			used_number_pieces_arr_for_level_862,
			used_number_pieces_arr_for_level_863,
			used_number_pieces_arr_for_level_864,
			used_number_pieces_arr_for_level_865,
			used_number_pieces_arr_for_level_866,
			used_number_pieces_arr_for_level_867,
			used_number_pieces_arr_for_level_868,
			used_number_pieces_arr_for_level_869,
			used_number_pieces_arr_for_level_870,
			used_number_pieces_arr_for_level_871,
			used_number_pieces_arr_for_level_872,
			used_number_pieces_arr_for_level_873,
			used_number_pieces_arr_for_level_874,
			used_number_pieces_arr_for_level_875,
			used_number_pieces_arr_for_level_876,
			used_number_pieces_arr_for_level_877,
			used_number_pieces_arr_for_level_878,
			used_number_pieces_arr_for_level_879,
			used_number_pieces_arr_for_level_880,
			used_number_pieces_arr_for_level_881,
			used_number_pieces_arr_for_level_882,
			used_number_pieces_arr_for_level_883,
			used_number_pieces_arr_for_level_884,
			used_number_pieces_arr_for_level_885,
			used_number_pieces_arr_for_level_886,
			used_number_pieces_arr_for_level_887,
			used_number_pieces_arr_for_level_888,
			used_number_pieces_arr_for_level_889,
			used_number_pieces_arr_for_level_890,
			used_number_pieces_arr_for_level_891,
			used_number_pieces_arr_for_level_892,
			used_number_pieces_arr_for_level_893,
			used_number_pieces_arr_for_level_894,
			used_number_pieces_arr_for_level_895,
			used_number_pieces_arr_for_level_896,
			used_number_pieces_arr_for_level_897,
			used_number_pieces_arr_for_level_898,
			used_number_pieces_arr_for_level_899,
			used_number_pieces_arr_for_level_900,
			used_number_pieces_arr_for_level_901,
			used_number_pieces_arr_for_level_902,
			used_number_pieces_arr_for_level_903,
			used_number_pieces_arr_for_level_904,
			used_number_pieces_arr_for_level_905,
			used_number_pieces_arr_for_level_906,
			used_number_pieces_arr_for_level_907,
			used_number_pieces_arr_for_level_908,
			used_number_pieces_arr_for_level_909,
			used_number_pieces_arr_for_level_910,
			used_number_pieces_arr_for_level_911,
			used_number_pieces_arr_for_level_912,
			used_number_pieces_arr_for_level_913,
			used_number_pieces_arr_for_level_914,
			used_number_pieces_arr_for_level_915,
			used_number_pieces_arr_for_level_916,
			used_number_pieces_arr_for_level_917,
			used_number_pieces_arr_for_level_918,
			used_number_pieces_arr_for_level_919,
			used_number_pieces_arr_for_level_920,
			used_number_pieces_arr_for_level_921,
			used_number_pieces_arr_for_level_922,
			used_number_pieces_arr_for_level_923,
			used_number_pieces_arr_for_level_924,
			used_number_pieces_arr_for_level_925,
			used_number_pieces_arr_for_level_926,
			used_number_pieces_arr_for_level_927,
			used_number_pieces_arr_for_level_928,
			used_number_pieces_arr_for_level_929,
			used_number_pieces_arr_for_level_930,
			used_number_pieces_arr_for_level_931,
			used_number_pieces_arr_for_level_932,
			used_number_pieces_arr_for_level_933,
			used_number_pieces_arr_for_level_934,
			used_number_pieces_arr_for_level_935,
			used_number_pieces_arr_for_level_936,
			used_number_pieces_arr_for_level_937,
			used_number_pieces_arr_for_level_938,
			used_number_pieces_arr_for_level_939,
			used_number_pieces_arr_for_level_940,
			used_number_pieces_arr_for_level_941,
			used_number_pieces_arr_for_level_942,
			used_number_pieces_arr_for_level_943,
			used_number_pieces_arr_for_level_944,
			used_number_pieces_arr_for_level_945,
			used_number_pieces_arr_for_level_946,
			used_number_pieces_arr_for_level_947,
			used_number_pieces_arr_for_level_948,
			used_number_pieces_arr_for_level_949,
			used_number_pieces_arr_for_level_950,
			used_number_pieces_arr_for_level_951,
			used_number_pieces_arr_for_level_952,
			used_number_pieces_arr_for_level_953,
			used_number_pieces_arr_for_level_954,
			used_number_pieces_arr_for_level_955,
			used_number_pieces_arr_for_level_956,
			used_number_pieces_arr_for_level_957,
			used_number_pieces_arr_for_level_958,
			used_number_pieces_arr_for_level_959,
			used_number_pieces_arr_for_level_960,
			used_number_pieces_arr_for_level_961,
			used_number_pieces_arr_for_level_962,
			used_number_pieces_arr_for_level_963,
			used_number_pieces_arr_for_level_964,
			used_number_pieces_arr_for_level_965,
			used_number_pieces_arr_for_level_966,
			used_number_pieces_arr_for_level_967,
			used_number_pieces_arr_for_level_968,
			used_number_pieces_arr_for_level_969,
			used_number_pieces_arr_for_level_970,
			used_number_pieces_arr_for_level_971,
			used_number_pieces_arr_for_level_972,
			used_number_pieces_arr_for_level_973,
			used_number_pieces_arr_for_level_974,
			used_number_pieces_arr_for_level_975,
			used_number_pieces_arr_for_level_976,
			used_number_pieces_arr_for_level_977,
			used_number_pieces_arr_for_level_978,
			used_number_pieces_arr_for_level_979,
			used_number_pieces_arr_for_level_980,
			used_number_pieces_arr_for_level_981,
			used_number_pieces_arr_for_level_982,
			used_number_pieces_arr_for_level_983,
			used_number_pieces_arr_for_level_984,
			used_number_pieces_arr_for_level_985,
			used_number_pieces_arr_for_level_986,
			used_number_pieces_arr_for_level_987,
			used_number_pieces_arr_for_level_988,
			used_number_pieces_arr_for_level_989,
			used_number_pieces_arr_for_level_990,
			used_number_pieces_arr_for_level_991,
			used_number_pieces_arr_for_level_992,
			used_number_pieces_arr_for_level_993,
			used_number_pieces_arr_for_level_994,
			used_number_pieces_arr_for_level_995,
			used_number_pieces_arr_for_level_996,
			used_number_pieces_arr_for_level_997,
			used_number_pieces_arr_for_level_998,
			used_number_pieces_arr_for_level_999,
			used_number_pieces_arr_for_level_1000;

		function loadLevel(level_id) {
			// do nothing if player tries to load the same level
			if(active_level_id == level_id) {
				return;
			}
			
			executeLevelChange(level_id);
		}

		function executeLevelChange(level_id) {
			$("#loading_div_content").html("");
			if(active_level_id != "home") {
				var current_level_num = active_level_id.substring("level_".length).toString();
				$("#loading_div_content").html("<span class='loading_div_content_blue_text'>Your progress in level "+current_level_num+" has been saved. </span><br>");
			}

			$("#"+active_level_id).removeClass("selected_level");
			active_level_id = level_id;
			$("#"+level_id).addClass("selected_level");

			if(level_id == "home") {
				$("#loading_div_content").html($("#loading_div_content").html()+"<span class='loading_div_content_gray_text'>Loading Home Page...</span>");
				displayLoadingScreen();
				$("#game_board_area").css({left: "-99999px", right: "auto"});
				// set left as 100px to prevent home page contents from colliding with
				// navigation panel items
				$("#home_page").css({left: "100px", right: "auto"});
			} else {
				// level_id is of the form "level_*i*" where *i* is a number,
				// so to retrieve the number of the level loaded, simply use
				// a substring operation on level_id
				var new_level_num = level_id.substring("level_".length).toString();
				$("#loading_div_content").html($("#loading_div_content").html()+"<span class='loading_div_content_gray_text'>Loading Level "+new_level_num+"...</span>");
				displayLoadingScreen();
				$("#home_page").css({left: "-99999px", right: "auto"});
				$("#game_board_area").css({left: "0px", right: "auto"});
				$("#level_display_box").html("Level "+new_level_num);
				setGivenNumbersArrForCurrentLevel(level_id);
				setupGameBoard(level_id);
			}
		}

		function setGivenNumbersArrForCurrentLevel(level_id) {
			var given_numbers_arr = getGivenNumbersArrForCurrentLevel(level_id);

			// empty given numbers array
			while(given_numbers_arr_for_current_level.length > 0) {
				given_numbers_arr_for_current_level.pop();
			}
			// populate given numbers array for current level
			for(var i = 0; i < 81; i++) {
				given_numbers_arr_for_current_level.push(given_numbers_arr[i]);
			}
		}

		function getGivenNumbersArrForCurrentLevel(level_id) {
			switch(level_id) {
				case "level_1":
					return [7,8,0,0,2,0,5,0,0,0,0,0,5,7,3,0,4,9,0,5,0,0,0,9,0,0,0,1,0,0,0,5,6,0,8,4,6,4,0,0,0,0,0,7,5,3,7,0,4,8,0,0,0,2,0,0,0,9,0,0,0,6,0,5,2,0,1,6,7,0,0,0,0,0,7,0,3,0,0,5,1];
				case "level_2":
					return [3,1,0,0,0,6,0,0,0,7,0,2,0,0,0,9,0,1,0,0,9,0,0,8,0,2,0,0,9,0,0,0,3,2,0,6,4,0,5,6,0,7,3,0,8,6,0,7,8,0,0,0,4,0,0,5,0,2,0,0,8,0,0,2,0,6,0,0,0,1,0,4,0,0,0,7,0,0,0,9,2];
				case "level_3":
					return [0,0,0,0,5,0,0,2,0,0,0,3,9,0,8,0,0,0,0,0,2,4,0,6,0,8,9,0,1,8,6,0,0,0,0,3,3,2,0,0,4,0,0,1,6,4,0,0,0,0,1,2,9,0,7,6,0,3,0,9,5,0,0,0,0,0,7,0,4,9,0,0,0,3,0,0,1,0,0,0,0];
				case "level_4":
					return [6,0,0,0,0,2,0,0,7,0,0,8,1,0,0,4,2,0,0,0,0,6,0,0,9,5,1,3,0,0,0,4,0,0,1,5,0,9,0,0,2,0,0,6,0,1,6,0,0,3,0,0,0,4,5,8,7,0,0,4,0,0,0,0,2,1,0,0,9,5,0,0,9,0,0,7,0,0,0,0,2];
				case "level_5":
					return [0,7,0,6,2,0,0,0,4,6,0,0,3,0,1,0,0,2,8,0,0,0,7,4,0,9,0,2,0,0,0,4,5,0,3,8,0,0,3,0,0,0,9,0,0,7,8,0,9,6,0,0,0,5,0,2,0,8,5,0,0,0,3,4,0,0,7,0,2,0,0,9,1,0,0,0,3,9,0,8,0];
				case "level_6":
					return [0,0,0,8,4,0,2,6,7,0,0,8,3,0,0,0,0,9,0,6,2,7,0,0,8,0,1,0,0,9,0,0,0,0,5,0,2,1,4,0,0,0,3,9,8,0,5,0,0,0,0,7,0,0,5,0,3,0,0,8,6,7,0,8,0,0,0,0,7,9,0,0,6,9,7,0,2,5,0,0,0];
				case "level_7":
					return [0,9,0,0,4,8,0,0,1,0,0,0,0,0,0,0,5,7,0,6,8,2,1,0,3,0,0,6,0,3,0,0,2,9,7,5,0,0,0,0,0,0,0,0,0,5,8,9,3,0,0,1,0,2,0,0,7,0,2,9,4,8,0,9,3,0,0,0,0,0,0,0,8,0,0,4,7,0,0,1,0];
				case "level_8":
					return [0,0,0,0,5,6,0,0,3,0,0,5,0,0,7,9,2,0,0,8,0,3,2,0,0,7,4,0,1,0,7,0,5,0,4,8,0,0,0,0,4,0,0,0,0,7,6,0,8,0,3,0,9,0,8,7,0,0,6,1,0,5,0,0,2,9,5,0,0,1,0,0,5,0,0,0,2,7,0,0,0];
				case "level_9":
					return [5,7,0,0,0,4,0,0,1,0,3,6,0,0,0,0,9,0,0,0,4,6,9,1,0,3,0,0,4,0,0,2,0,0,0,6,8,0,2,0,0,0,1,0,3,6,0,0,0,1,0,0,5,0,0,6,0,7,8,2,5,0,0,0,1,0,0,0,0,2,8,0,7,0,0,1,0,0,0,6,9];
				case "level_10":
					return [0,9,4,0,0,6,0,0,1,0,0,7,9,0,5,2,0,0,0,0,0,8,0,1,0,9,6,0,0,5,0,0,8,0,4,0,0,6,8,0,0,0,9,7,0,0,7,0,2,0,0,8,0,0,5,4,0,1,0,3,0,0,0,0,0,6,5,0,2,4,0,0,2,0,0,4,0,0,3,5,0];
				case "level_11":
					return [8,0,1,6,0,0,0,4,0,0,0,0,0,5,3,7,0,0,7,0,0,2,4,1,0,0,8,0,0,0,0,7,6,0,9,2,1,6,0,0,0,0,0,8,7,4,7,0,9,1,0,0,0,0,9,0,0,7,3,4,0,0,5,0,0,4,5,8,0,0,0,0,0,2,0,0,0,9,8,0,4];
				case "level_12":
					return [0,0,6,0,0,0,0,1,0,0,0,7,1,0,9,0,0,5,0,1,0,8,2,0,3,0,7,0,5,8,0,0,6,0,3,0,3,0,2,0,1,0,4,0,6,0,9,0,7,0,0,1,5,0,7,0,5,0,4,1,0,8,0,9,0,0,2,0,5,6,0,0,0,6,0,0,0,0,5,0,0];
				case "level_13":
					return [0,0,5,1,0,7,0,8,3,0,0,8,2,0,5,7,0,9,0,0,0,0,0,0,0,0,5,3,7,0,0,0,2,0,0,1,0,5,6,3,0,4,9,7,0,8,0,0,5,0,0,0,2,6,6,0,0,0,0,0,0,0,0,4,0,7,9,0,1,6,0,0,5,2,0,7,0,6,1,0,0];
				case "level_14":
					return [9,7,0,6,0,0,4,0,0,0,0,2,9,0,0,0,7,0,6,3,0,0,0,0,0,0,9,0,9,6,0,8,0,3,4,0,4,0,0,3,0,6,0,0,2,0,1,3,0,7,0,5,9,0,3,0,0,0,0,0,0,5,1,0,8,0,0,0,5,9,0,0,0,0,9,0,0,8,0,2,4];
				case "level_15":
					return [0,2,0,0,0,0,0,0,4,1,0,0,4,0,6,0,2,5,0,0,0,7,2,3,0,1,0,0,4,2,6,0,0,1,9,0,0,7,0,9,0,5,0,8,0,0,9,1,0,0,2,5,7,0,0,5,0,8,6,9,0,0,0,6,8,0,2,0,1,0,0,7,2,0,0,0,0,0,0,6,0];
				case "level_16":
					return [8,0,0,9,0,4,2,0,0,0,5,0,8,0,0,1,9,6,0,0,2,0,5,7,0,0,8,2,8,0,0,0,0,3,0,0,0,0,5,0,0,0,7,0,0,0,0,9,0,0,0,0,4,1,4,0,0,2,3,0,5,0,0,6,7,3,0,0,5,0,2,0,0,0,1,7,0,9,0,0,3];
				case "level_17":
					return [0,0,7,0,0,3,4,0,0,0,2,1,0,0,8,0,0,3,6,0,5,9,4,0,0,8,0,7,8,0,0,0,0,3,0,9,0,5,0,0,0,0,0,4,0,9,0,4,0,0,0,0,7,2,0,4,0,0,7,5,6,0,8,5,0,0,6,0,0,1,3,0,0,0,8,2,0,0,9,0,0];
				case "level_18":
					return [0,0,2,5,1,6,9,4,0,6,0,0,0,0,8,7,0,0,0,9,8,2,0,0,6,0,0,5,0,1,0,9,4,0,0,0,0,0,7,0,0,0,3,0,0,0,0,0,7,2,0,1,0,4,0,0,5,0,0,9,8,2,0,0,0,6,4,0,0,0,0,3,0,7,9,8,5,3,4,0,0];
				case "level_19":
					return [0,0,3,7,2,0,0,4,8,4,0,0,3,0,5,0,9,0,1,0,0,0,0,0,3,0,0,7,0,9,0,0,1,8,0,0,2,8,0,0,3,0,0,1,6,0,0,5,4,0,0,9,0,3,0,0,1,0,0,0,0,0,9,0,5,0,2,0,9,0,0,1,9,4,0,0,6,3,7,0,0];
				case "level_20":
					return [0,0,0,9,7,0,2,6,0,0,0,0,0,5,8,0,9,0,9,4,0,2,0,0,0,0,0,3,9,0,7,0,0,0,5,6,0,0,7,0,3,0,4,0,0,1,8,0,0,0,5,0,3,9,0,0,0,0,0,6,0,2,8,0,1,0,3,8,0,0,0,0,0,5,8,0,2,7,0,0,0];
				case "level_21":
					return [0,3,1,0,0,4,9,0,0,4,0,0,5,6,9,0,2,0,5,2,0,0,0,0,0,6,0,0,4,0,0,8,0,5,0,0,8,0,7,0,0,0,2,0,9,0,0,5,0,9,0,0,1,0,0,9,0,0,0,0,0,7,8,0,5,0,3,7,8,0,0,1,0,0,3,9,0,0,6,5,0];
				case "level_22":
					return [6,3,0,7,0,0,2,4,0,8,0,1,0,6,0,5,3,0,0,0,0,1,0,0,7,0,0,5,0,2,4,8,0,0,0,0,0,0,7,9,0,6,1,0,0,0,0,0,0,7,1,3,0,8,0,0,8,0,0,7,0,0,0,0,6,9,0,4,0,8,0,5,0,4,3,0,0,9,0,1,2];
				case "level_23":
					return [0,0,0,6,0,0,0,3,0,3,4,0,0,5,0,2,6,0,0,0,9,1,0,2,0,0,4,4,0,5,9,6,0,0,0,0,9,8,0,0,0,0,0,4,3,0,0,0,0,8,7,6,0,9,7,0,0,2,0,6,3,0,0,0,2,8,0,4,0,0,9,7,0,3,0,0,0,8,0,0,0];
				case "level_24":
					return [7,0,0,0,8,9,0,4,1,0,3,9,0,0,0,0,0,0,0,0,4,1,7,0,0,2,0,9,4,5,3,0,0,8,0,2,0,0,0,0,0,0,0,0,0,3,0,6,0,0,8,5,7,9,0,9,0,0,1,4,2,0,0,0,0,0,0,0,0,7,5,0,4,6,0,8,2,0,0,0,3];
				case "level_25":
					return [8,0,5,0,9,7,3,0,0,0,9,3,0,6,8,1,0,0,1,0,0,5,0,0,0,8,0,0,0,0,0,2,6,0,9,7,0,0,0,0,0,0,0,0,0,2,8,0,9,7,0,0,0,0,0,4,0,0,0,1,0,0,3,0,0,7,2,4,0,8,1,0,0,0,8,7,5,0,2,0,6];
				case "level_26":
					return [7,0,0,2,5,0,0,8,9,0,5,8,0,7,0,0,0,0,2,1,0,9,0,0,5,0,0,0,0,0,5,0,0,1,0,0,0,8,4,1,9,2,7,6,0,0,0,9,0,0,3,0,0,0,0,0,7,0,0,5,0,3,2,0,0,0,0,2,0,8,5,0,3,2,0,0,8,4,0,0,6];
				case "level_27":
					return [0,6,0,0,0,0,7,4,0,9,3,0,8,0,2,0,0,0,7,0,8,0,5,4,9,2,0,3,0,0,0,0,1,8,7,0,8,0,0,0,0,0,0,0,2,0,7,2,3,0,0,0,0,4,0,8,9,7,3,0,2,0,1,0,0,0,1,0,8,0,5,9,0,5,3,0,0,0,0,8,0];
				case "level_28":
					return [0,9,0,0,0,0,0,0,4,0,0,2,9,4,0,6,0,7,1,0,0,6,5,0,0,0,0,0,3,6,2,0,0,1,0,5,0,7,8,4,0,6,9,3,0,2,0,9,0,0,5,4,8,0,0,0,0,0,7,2,0,0,9,9,0,3,0,6,1,7,0,0,7,0,0,0,0,0,0,6,0];
				case "level_29":
					return [6,0,0,9,0,0,0,0,7,2,9,5,0,0,3,0,0,0,0,1,7,0,0,6,0,2,0,1,0,8,0,4,0,0,0,3,0,0,6,0,7,0,8,0,0,4,0,0,0,3,0,1,0,2,0,5,0,1,0,0,7,3,0,0,0,0,8,0,0,2,6,1,8,0,0,0,0,7,0,0,9];
				case "level_30":
					return [0,0,2,0,0,0,0,0,8,0,3,0,8,0,0,0,0,0,8,0,1,7,3,0,9,4,5,3,0,5,0,0,8,0,1,9,6,0,0,2,0,5,0,0,7,1,8,0,4,0,0,2,0,6,5,9,6,0,4,7,1,0,2,0,0,0,0,0,6,0,9,0,4,0,0,0,0,0,5,0,0];
				case "level_31":
					return [0,4,0,8,0,0,9,2,5,0,0,5,7,0,2,0,0,6,8,0,0,0,5,4,1,0,0,0,1,6,0,0,0,0,0,7,2,0,0,0,0,0,0,0,8,5,0,0,0,0,0,4,3,0,0,0,3,2,8,0,0,0,4,4,0,0,1,0,7,3,0,0,6,7,9,0,0,3,0,8,0];
				case "level_32":
					return [0,2,5,0,0,7,0,3,1,0,9,1,0,5,0,0,0,2,0,0,0,0,0,6,4,0,0,0,0,0,8,6,0,2,7,0,0,6,0,7,4,2,0,9,0,0,7,2,0,3,9,0,0,0,0,0,8,6,0,0,0,0,0,7,0,0,0,2,0,3,1,0,1,5,0,4,0,0,8,2,0];
				case "level_33":
					return [0,3,0,0,0,1,0,0,0,9,0,0,2,0,4,6,0,0,0,1,2,0,7,0,0,9,3,0,0,0,0,1,6,7,0,9,3,9,0,0,0,0,0,5,6,6,0,1,8,5,0,0,0,0,8,6,0,0,9,0,5,2,0,0,0,3,1,0,2,0,0,8,0,0,0,5,0,0,0,3,0];
				case "level_34":
					return [0,0,3,9,0,4,7,0,0,0,9,6,0,0,2,0,0,5,0,0,0,8,0,5,0,9,2,0,0,4,0,0,8,0,6,0,0,2,8,0,0,0,9,3,0,0,3,0,7,0,0,8,0,0,4,6,0,5,0,1,0,0,0,7,0,0,6,0,0,1,4,0,0,0,2,4,0,7,6,0,0];
				case "level_35":
					return [8,0,6,2,3,4,0,5,0,0,0,0,6,0,9,0,0,0,9,7,0,0,0,0,0,0,4,5,0,1,0,9,8,2,0,6,0,0,8,0,0,0,5,0,0,7,0,4,5,2,0,3,0,8,6,0,0,0,0,0,0,8,5,0,0,0,8,0,6,0,0,0,0,8,0,7,4,2,9,0,3];
				case "level_36":
					return [0,0,0,4,0,0,2,0,1,4,0,0,2,1,8,0,0,3,2,0,0,0,6,0,0,4,0,5,0,0,0,2,7,0,1,0,8,2,0,0,0,0,0,6,4,0,3,0,6,8,0,0,0,9,0,6,0,0,3,0,0,0,5,3,0,0,1,9,5,0,0,6,9,0,8,0,0,6,0,0,0];
				case "level_37":
					return [3,9,2,0,0,6,8,0,0,6,0,0,4,8,0,0,5,0,0,5,0,1,0,2,0,0,6,0,7,0,0,0,0,6,0,5,0,4,0,0,0,0,0,8,0,9,0,1,0,0,0,0,2,0,7,0,0,2,0,4,0,9,0,0,8,0,0,7,5,0,0,1,0,0,5,8,0,0,4,7,3];
				case "level_38":
					return [0,7,8,9,0,0,2,0,1,0,0,0,4,0,0,0,0,5,5,6,0,0,2,0,3,0,9,1,5,0,8,4,0,0,0,0,8,0,0,3,0,9,0,0,4,0,0,0,0,5,2,0,6,7,6,0,1,0,3,0,0,5,8,4,0,0,0,0,8,0,0,0,7,0,2,0,0,4,1,3,0];
				case "level_39":
					return [5,2,0,4,8,6,0,3,0,0,0,0,0,5,0,2,0,0,0,8,0,0,1,3,0,6,0,0,3,0,0,6,0,0,0,2,6,7,0,0,0,0,0,9,3,2,0,0,0,7,0,0,1,0,0,6,0,8,9,0,0,4,0,0,0,1,0,4,0,0,0,0,0,9,0,5,3,1,0,7,6];
				case "level_40":
					return [6,0,1,0,7,2,0,0,3,0,2,0,0,3,6,8,0,0,0,9,0,8,0,0,0,2,0,0,0,4,6,0,0,0,0,8,2,0,9,0,8,0,4,0,6,8,0,0,0,0,3,1,0,0,0,1,0,0,0,4,0,3,0,0,0,6,1,9,0,0,8,0,7,0,0,3,5,0,9,0,1];
				case "level_41":
					return [0,0,6,0,8,0,4,5,0,3,0,0,9,0,5,6,7,0,0,5,0,6,0,4,0,0,2,0,0,0,0,6,0,0,4,5,0,0,0,7,0,3,0,0,0,1,3,0,0,4,0,0,0,0,5,0,0,1,0,6,0,8,0,0,2,1,5,0,8,0,0,7,0,8,9,0,2,0,5,0,0];
				case "level_42":
					return [0,7,1,2,4,0,0,3,6,0,9,0,0,5,8,0,0,2,0,0,0,0,7,0,1,8,9,1,6,3,0,0,0,0,0,0,4,0,0,0,0,0,0,0,7,0,0,0,0,0,0,6,1,8,6,5,2,0,1,0,0,0,0,9,0,0,8,2,0,0,6,0,7,1,0,0,3,6,2,9,0];
				case "level_43":
					return [0,2,0,0,7,0,8,0,1,0,6,0,9,0,0,5,7,0,0,0,1,0,5,0,6,0,0,0,3,7,0,6,0,2,0,0,9,0,2,3,0,7,1,0,5,0,0,4,0,2,0,9,3,0,0,0,6,0,8,0,7,0,0,0,4,8,0,0,6,0,1,0,2,0,9,0,3,0,0,8,0];
				case "level_44":
					return [0,0,0,0,0,0,0,7,1,0,3,0,0,0,7,0,9,5,7,0,9,0,0,0,6,8,4,0,7,5,0,6,8,0,0,0,0,9,0,7,0,1,0,4,0,0,0,0,2,4,0,9,5,0,8,2,7,0,0,0,4,0,9,9,5,0,3,0,0,0,1,0,3,4,0,0,0,0,0,0,0];
				case "level_45":
					return [9,8,5,0,2,6,0,0,0,6,0,4,0,0,5,0,8,9,0,0,3,0,0,1,0,0,6,0,7,0,0,0,0,0,0,3,1,3,6,0,0,0,9,4,2,5,0,0,0,0,0,0,7,0,3,0,0,5,0,0,6,0,0,8,5,0,6,0,0,7,0,1,0,0,0,7,9,0,8,3,5];
				case "level_46":
					return [3,0,8,0,7,4,0,1,6,2,1,9,0,6,0,0,0,0,0,0,4,2,5,0,0,0,9,0,0,0,0,0,0,1,3,8,0,0,6,0,0,0,7,0,0,1,8,2,0,0,0,0,0,0,8,0,0,0,4,2,9,0,0,0,0,0,0,1,0,8,4,5,9,4,0,8,3,0,6,0,1];
				case "level_47":
					return [8,0,3,0,7,5,2,0,0,0,1,0,8,0,0,0,0,7,0,6,5,0,9,2,3,0,0,0,0,0,0,2,4,0,5,3,0,0,0,0,0,0,0,0,0,4,2,0,6,5,0,0,0,0,0,0,1,2,4,0,9,3,0,3,0,0,0,0,9,0,8,0,0,0,8,3,6,0,1,0,4];
				case "level_48":
					return [0,0,0,0,0,5,0,0,6,8,2,0,0,4,0,9,0,0,6,4,0,0,0,3,2,1,0,0,0,0,7,8,0,0,9,4,0,7,0,4,3,9,0,5,0,4,9,0,0,5,6,0,0,0,0,8,2,9,0,0,0,4,1,0,0,4,0,1,0,0,7,2,3,0,0,5,0,0,0,0,0];
				case "level_49":
					return [9,2,0,0,4,0,3,0,8,0,7,1,8,0,0,4,0,6,0,0,0,5,0,0,0,0,9,6,9,0,1,5,0,0,0,0,1,0,0,3,0,8,0,0,5,0,0,0,0,9,4,0,2,7,5,0,0,0,0,1,0,0,0,7,0,4,0,0,5,6,3,0,2,0,6,0,3,0,0,9,1];
				case "level_50":
					return [0,0,0,6,7,0,9,0,0,0,9,7,0,3,5,8,2,0,6,0,0,0,0,0,0,0,0,0,7,9,0,0,0,5,0,0,1,5,4,9,0,8,7,3,2,0,0,2,0,0,0,1,4,0,0,0,0,0,0,0,0,0,5,0,4,6,7,8,0,3,9,0,0,0,1,0,9,6,0,0,0];
				case "level_51":
					return [0,0,6,0,5,0,8,0,0,8,2,9,1,0,0,4,0,5,0,0,0,0,8,4,0,2,9,0,9,0,0,6,5,0,0,3,0,3,0,0,0,0,0,9,0,1,0,0,9,2,0,0,8,0,3,8,0,6,4,0,0,0,0,9,0,4,0,0,7,2,6,8,0,0,2,0,9,0,3,0,0];
				case "level_52":
					return [1,0,0,9,7,0,4,6,3,6,0,5,2,0,0,0,0,0,0,0,4,0,0,0,8,0,5,0,1,7,8,3,0,0,0,0,5,0,0,6,0,7,0,0,8,0,0,0,0,5,1,3,7,0,4,0,8,0,0,0,1,0,0,0,0,0,0,0,6,9,0,2,2,7,9,0,1,4,0,0,6];
				case "level_53":
					return [4,0,9,2,0,0,0,0,1,1,0,5,3,0,0,6,9,0,0,0,0,0,1,9,0,4,3,3,7,0,9,0,0,0,1,0,9,0,0,0,0,0,0,0,5,0,1,0,0,0,7,0,2,8,7,4,0,8,2,0,0,0,0,0,5,1,0,0,3,8,0,2,2,0,0,0,0,1,3,0,4];
				case "level_54":
					return [0,5,0,0,0,8,0,0,0,9,0,0,4,0,6,2,0,0,0,8,4,0,7,0,0,9,5,0,0,0,0,8,2,7,0,9,5,9,0,0,0,0,0,1,2,2,0,8,3,1,0,0,0,0,3,2,0,0,9,0,1,4,0,0,0,5,8,0,4,0,0,3,0,0,0,1,0,0,0,5,0];
				case "level_55":
					return [0,0,8,4,6,0,0,0,0,0,6,0,7,3,0,8,2,0,3,0,0,0,0,0,6,0,0,1,9,0,5,0,0,4,8,0,2,8,0,3,0,9,0,1,6,0,7,5,0,0,4,0,3,2,0,0,9,0,0,0,0,0,8,0,3,6,0,9,8,0,4,0,0,0,0,0,5,3,7,0,0];
				case "level_56":
					return [7,0,0,8,3,9,0,0,1,0,0,0,0,4,2,0,7,0,1,9,0,6,0,0,3,0,0,0,0,0,0,7,6,5,0,8,9,0,6,0,0,0,1,0,7,3,0,7,5,9,0,0,0,0,0,0,8,0,0,5,0,1,3,0,3,0,4,1,0,0,0,0,5,0,0,7,2,3,0,0,4];
				case "level_57":
					return [0,0,7,5,0,6,8,2,0,0,1,0,0,0,0,0,5,0,0,0,0,0,0,3,6,0,4,0,0,1,4,0,7,0,8,9,8,0,9,0,6,0,2,0,7,2,7,0,3,0,8,4,0,0,7,0,3,8,0,0,0,0,0,0,5,0,0,0,0,0,7,0,0,2,8,9,0,1,3,0,0];
				case "level_58":
					return [1,5,0,0,8,7,6,0,0,4,0,0,0,0,9,0,5,2,0,0,0,6,2,5,0,1,8,6,0,9,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,1,0,6,9,2,0,5,7,3,0,0,0,5,6,0,8,0,0,0,0,1,0,0,4,1,6,0,0,3,5];
				case "level_59":
					return [0,0,3,8,5,2,0,6,0,8,0,0,6,0,0,7,0,9,0,0,5,0,0,0,3,2,0,2,0,0,0,4,0,6,0,0,3,8,0,0,0,0,0,4,1,0,0,9,0,8,0,0,0,2,0,4,1,0,0,0,8,0,0,5,0,2,0,0,8,0,0,7,0,9,0,4,1,7,2,0,0];
				case "level_60":
					return [1,6,0,2,0,0,0,5,0,4,0,3,0,7,5,0,0,2,0,0,2,1,4,0,0,0,0,7,0,4,3,0,9,0,0,6,0,0,0,0,8,0,0,0,0,5,0,0,4,0,2,3,0,8,0,0,0,0,2,7,9,0,0,3,0,0,9,1,0,8,0,4,0,2,0,0,0,4,0,6,1];
				case "level_61":
					return [0,0,0,6,0,0,9,0,0,2,4,0,7,0,0,3,0,1,0,5,9,0,1,0,7,0,8,0,9,3,2,6,0,0,0,0,0,0,2,8,0,7,6,0,0,0,0,0,0,9,1,4,5,0,3,0,5,0,8,0,2,9,0,1,0,4,0,0,6,0,8,3,0,0,6,0,0,2,0,0,0];
				case "level_62":
					return [4,0,0,3,7,0,1,8,0,0,0,6,1,0,9,0,5,0,0,0,1,0,0,0,0,0,6,1,0,3,0,0,8,0,0,5,0,6,7,0,3,0,9,2,0,2,0,0,6,0,0,4,0,1,3,0,0,0,0,0,6,0,0,0,1,0,5,0,3,8,0,0,0,8,2,0,9,4,0,0,3];
				case "level_63":
					return [0,0,0,8,4,6,0,9,2,0,4,0,0,0,1,0,0,0,6,2,0,0,7,0,8,0,0,9,0,0,0,3,5,0,8,7,2,8,0,0,0,0,0,5,4,5,3,0,4,2,0,0,0,6,0,0,2,0,9,0,0,3,8,0,0,0,1,0,0,0,2,0,1,5,0,7,8,2,0,0,0];
				case "level_64":
					return [0,4,0,5,0,0,0,0,0,0,0,0,7,3,0,0,8,6,3,6,0,0,1,8,7,0,0,0,0,0,0,8,0,6,2,1,0,9,8,3,0,6,5,7,0,2,5,6,0,4,0,0,0,0,0,0,5,6,9,0,0,4,2,9,8,0,0,5,3,0,0,0,0,0,0,0,0,4,0,3,0];
				case "level_65":
					return [7,0,9,0,0,0,0,0,6,0,4,0,5,2,0,9,0,0,0,5,0,0,3,9,0,7,0,2,0,0,7,0,0,3,6,0,0,1,4,0,9,0,7,8,0,0,7,5,0,0,3,0,0,9,0,8,0,9,6,0,0,3,0,0,0,3,0,4,2,0,5,0,5,0,0,0,0,0,6,0,4];
				case "level_66":
					return [0,3,6,1,0,0,0,0,5,0,0,4,6,2,7,1,0,0,0,0,0,0,3,4,0,6,0,0,0,0,0,9,1,6,0,7,3,0,7,0,0,0,9,0,8,1,0,5,8,7,0,0,0,0,0,7,0,2,4,0,0,0,0,0,0,3,9,6,5,7,0,0,6,0,0,0,0,8,3,9,0];
				case "level_67":
					return [6,0,5,0,0,4,0,7,0,0,0,1,0,0,8,9,0,0,0,9,4,7,3,0,0,0,2,3,8,0,0,0,0,2,1,0,2,0,0,0,0,0,0,0,7,0,1,6,0,0,0,0,3,9,9,0,0,0,2,1,7,4,0,0,0,2,6,0,0,3,0,0,0,6,0,9,0,0,5,0,8];
				case "level_68":
					return [0,8,0,0,0,1,0,7,6,0,3,0,8,6,0,0,0,9,0,9,1,0,0,0,8,5,0,0,4,0,0,0,7,0,0,5,5,0,6,9,0,3,7,0,8,3,0,0,6,0,0,0,2,0,0,5,9,0,0,0,3,6,0,8,0,0,0,1,6,0,9,0,1,6,0,2,0,0,0,8,0];
				case "level_69":
					return [0,1,0,0,0,0,0,9,6,0,0,4,0,0,9,0,1,3,3,0,0,0,0,1,7,0,0,4,0,6,0,2,0,9,0,1,0,7,0,9,0,6,0,4,0,1,0,5,0,3,0,6,0,8,0,0,1,5,0,0,0,0,2,7,4,0,2,0,0,1,0,0,5,8,0,0,0,0,0,6,0];
				case "level_70":
					return [0,0,0,9,1,0,7,0,0,0,0,0,4,0,3,1,6,5,0,3,1,0,5,0,0,9,0,0,7,8,0,4,1,9,2,0,0,0,0,0,0,0,0,0,0,0,1,9,7,6,0,5,8,0,0,9,0,0,2,0,8,5,0,1,2,4,8,0,5,0,0,0,0,0,3,0,9,7,0,0,0];
				case "level_71":
					return [0,6,0,8,4,1,0,7,0,4,0,0,0,0,9,8,6,0,0,0,7,5,3,0,0,0,0,2,1,0,9,7,0,0,0,0,6,7,0,0,0,0,0,8,9,0,0,0,0,8,2,0,4,7,0,0,0,0,6,3,4,0,0,0,4,6,2,0,0,0,0,1,0,3,0,4,5,7,0,2,0];
				case "level_72":
					return [9,0,0,0,4,0,7,0,3,0,0,1,0,7,9,0,0,0,5,4,7,3,0,2,0,0,0,6,0,9,7,2,0,8,0,1,0,0,0,0,0,0,0,0,0,8,0,4,0,5,1,9,0,7,0,0,0,4,0,8,2,7,6,0,0,0,1,9,0,3,0,0,4,0,8,0,6,0,0,0,9];
				case "level_73":
					return [0,4,0,0,0,0,0,0,0,1,0,2,0,5,9,8,0,7,0,0,0,7,2,0,0,0,3,3,0,8,0,0,0,0,0,6,9,6,1,5,0,2,4,3,8,4,0,0,0,0,0,9,0,2,2,0,0,0,9,7,0,0,0,5,0,6,4,1,0,2,0,9,0,0,0,0,0,0,0,7,0];
				case "level_74":
					return [5,0,0,2,0,0,7,0,0,0,0,0,0,6,5,0,0,0,6,0,1,0,9,0,0,8,2,0,0,4,0,7,0,0,1,3,1,3,7,0,4,0,6,2,5,9,5,0,0,2,0,8,0,0,8,2,0,0,3,0,4,0,9,0,0,0,7,5,0,0,0,0,0,0,9,0,0,2,0,0,1];
				case "level_75":
					return [2,0,0,8,0,0,3,1,4,0,7,0,0,2,9,8,0,0,0,0,8,4,0,6,0,7,0,8,0,7,0,0,0,0,5,0,0,2,0,0,0,0,0,9,0,0,4,0,0,0,0,1,0,6,0,1,0,9,0,4,5,0,0,0,0,6,7,5,0,0,2,0,9,5,3,0,0,2,0,0,7];
				case "level_76":
					return [6,0,0,0,0,5,8,1,0,0,0,8,0,0,0,5,9,0,0,1,0,0,0,8,0,0,7,9,6,0,0,3,0,0,8,5,0,0,7,5,0,9,6,0,0,4,8,0,0,1,0,0,2,9,8,0,0,4,0,0,0,3,0,0,4,2,0,0,0,9,0,0,0,7,6,3,0,0,0,0,8];
				case "level_77":
					return [0,3,0,0,2,4,0,8,0,0,0,0,7,0,5,0,0,0,9,8,0,0,0,0,0,7,5,4,2,0,5,0,6,0,9,7,0,0,1,0,9,0,4,0,0,8,9,0,4,0,7,0,2,6,2,7,0,0,0,0,0,1,4,0,0,0,1,0,9,0,0,0,0,4,0,6,7,0,0,3,0];
				case "level_78":
					return [0,9,0,2,3,5,0,7,0,0,0,3,0,0,4,0,9,2,7,0,0,1,6,0,0,0,0,0,5,8,4,7,0,0,0,0,0,7,9,0,0,0,4,2,0,0,0,0,0,2,8,7,3,0,0,0,0,0,9,6,0,0,3,9,3,0,8,0,0,5,0,0,0,6,0,3,1,7,0,8,0];
				case "level_79":
					return [8,2,0,0,0,0,0,6,0,7,3,0,2,1,0,8,0,9,0,0,0,3,0,9,7,4,0,9,8,0,5,0,0,4,0,0,0,0,3,0,0,0,9,0,0,0,0,2,0,0,4,0,8,3,0,1,7,9,0,5,0,0,0,3,0,5,0,4,8,0,9,7,0,9,0,0,0,0,0,1,4];
				case "level_80":
					return [0,0,0,0,9,3,7,0,1,9,4,0,1,0,0,3,2,0,7,3,0,8,0,0,0,0,9,1,0,6,3,0,0,9,0,0,3,0,0,0,0,0,0,0,4,0,0,9,0,0,6,8,0,5,8,0,0,0,0,9,0,1,7,0,9,4,0,0,1,0,5,8,6,0,7,5,8,0,0,0,0];
				case "level_81":
					return [3,0,0,0,6,2,8,0,9,0,8,0,9,3,0,1,0,0,0,2,5,0,0,0,0,0,0,2,4,8,5,0,0,0,6,1,0,0,0,0,0,0,0,0,0,5,7,0,0,0,6,3,4,2,0,0,0,0,0,0,4,3,0,0,0,2,0,9,8,0,1,0,8,0,7,6,1,0,0,0,5];
				case "level_82":
					return [2,0,0,0,0,0,3,1,7,3,0,0,6,0,0,0,0,2,0,0,1,2,3,0,6,9,4,0,0,0,0,2,4,1,0,0,0,0,0,5,0,9,0,0,0,0,0,2,7,8,0,0,0,0,7,2,3,0,9,6,8,0,0,5,0,0,0,0,3,0,0,9,9,8,6,0,0,0,0,0,3];
				case "level_83":
					return [0,0,9,3,0,5,0,0,0,0,0,0,0,8,0,0,0,2,0,0,4,9,0,2,0,5,6,9,0,7,8,0,0,0,3,0,8,6,0,0,3,0,0,2,7,0,2,0,0,0,6,1,0,8,1,9,0,6,0,3,7,0,0,7,0,0,0,4,0,0,0,0,0,0,0,1,0,9,2,0,0];
				case "level_84":
					return [6,0,0,4,9,5,0,0,0,9,1,0,7,0,8,0,6,0,0,8,0,0,0,0,0,0,9,3,0,6,0,0,7,9,0,8,2,0,0,1,0,3,0,0,5,5,0,1,9,0,0,6,0,3,7,0,0,0,0,0,0,9,0,0,5,0,6,0,9,0,7,2,0,0,0,3,7,2,0,0,1];
				case "level_85":
					return [0,8,0,6,0,0,5,9,1,7,0,0,0,8,2,6,0,0,0,0,6,9,0,3,0,0,7,0,6,7,0,0,0,0,0,4,8,0,0,0,0,0,0,0,2,9,0,0,0,0,0,1,3,0,1,0,0,2,0,9,4,0,0,0,0,3,7,4,0,0,0,8,4,2,5,0,0,8,0,7,0];
				case "level_86":
					return [8,0,7,0,4,0,0,0,0,0,5,0,0,9,7,0,1,0,0,1,2,8,0,0,6,0,7,7,0,0,0,0,0,0,6,1,3,0,0,4,0,6,0,0,9,6,8,0,0,0,0,0,0,4,2,0,3,0,0,5,9,7,0,0,6,0,7,2,0,0,3,0,0,0,0,0,6,0,4,0,5];
				case "level_87":
					return [4,0,0,0,2,6,0,0,8,1,0,0,4,5,0,6,0,0,0,8,6,0,0,0,0,7,0,0,5,0,8,0,0,2,0,7,3,0,1,0,6,0,8,0,9,8,0,4,0,0,2,0,6,0,0,4,0,0,0,0,7,1,0,0,0,2,0,1,5,0,0,4,9,0,0,6,7,0,0,0,2];
				case "level_88":
					return [0,1,7,0,9,6,0,0,4,0,0,0,5,4,0,3,9,0,0,0,5,7,0,0,0,0,0,0,0,0,0,7,0,4,1,6,4,0,8,6,0,5,9,0,3,6,2,1,0,3,0,0,0,0,0,0,0,0,0,4,7,0,0,0,6,3,0,5,8,0,0,0,8,0,0,3,2,0,6,5,0];
				case "level_89":
					return [0,0,3,7,1,0,0,6,0,9,0,0,0,6,0,5,4,0,8,0,0,0,0,0,9,0,3,0,0,0,0,5,4,7,0,9,6,9,0,0,7,0,0,3,4,1,0,4,8,9,0,0,0,0,2,0,9,0,0,0,0,0,7,0,4,8,0,2,0,0,0,6,0,6,0,0,3,5,4,0,0];
				case "level_90":
					return [0,0,0,0,0,0,0,9,0,0,9,0,2,4,6,3,0,0,3,8,0,0,5,9,7,0,0,0,0,3,0,0,5,2,0,1,0,7,9,3,0,8,4,6,0,1,0,6,4,0,0,9,0,0,0,0,5,8,9,0,0,3,4,0,0,1,5,3,7,0,2,0,0,3,0,0,0,0,0,0,0];
				case "level_91":
					return [2,0,0,0,0,1,8,9,0,8,0,9,5,0,0,6,1,0,0,0,0,9,0,0,0,0,5,0,2,0,0,0,0,4,8,7,5,7,0,0,0,0,0,6,1,9,8,1,0,0,0,0,5,0,3,0,0,0,0,4,0,0,0,0,4,8,0,0,5,3,0,9,0,6,5,3,0,0,0,0,8];
				case "level_92":
					return [0,0,7,4,0,8,2,0,0,0,0,0,0,7,0,0,0,0,0,9,6,1,0,5,8,3,0,5,0,0,8,0,4,0,7,2,0,8,0,0,5,0,0,1,0,6,4,0,7,0,2,0,0,8,0,7,8,5,0,1,3,9,0,0,0,0,0,6,0,0,0,0,0,0,1,3,0,7,5,0,0];
				case "level_93":
					return [9,0,6,2,5,0,0,0,0,7,0,8,0,0,0,9,0,0,3,5,0,8,0,4,0,2,0,0,7,0,0,0,0,8,0,2,0,0,0,4,6,1,0,0,0,1,0,5,0,0,0,0,6,0,0,6,0,1,0,3,0,7,8,0,0,3,0,0,0,1,0,5,0,0,0,0,2,8,6,0,3];
				case "level_94":
					return [7,0,0,0,0,9,0,0,0,0,3,8,0,0,7,0,9,6,0,6,9,8,0,0,0,0,1,2,4,6,0,0,0,1,0,0,8,0,3,0,0,0,2,0,7,0,0,7,0,0,0,6,8,9,6,0,0,0,0,5,3,7,0,9,5,0,7,0,0,4,6,0,0,0,0,4,0,0,0,0,5];
				case "level_95":
					return [0,8,0,0,0,0,0,0,1,0,2,7,0,8,1,6,0,0,0,0,0,0,3,7,0,9,0,0,3,9,0,0,6,7,0,4,4,0,1,7,0,8,5,0,2,5,0,8,3,0,0,1,6,0,0,1,0,6,2,0,0,0,0,0,0,2,9,7,0,4,1,0,7,0,0,0,0,0,0,2,0];
				case "level_96":
					return [0,0,0,1,6,0,7,0,0,9,0,1,2,7,0,6,0,8,0,6,0,0,0,4,2,0,0,8,7,0,3,1,0,0,0,0,5,0,0,0,0,0,0,0,2,0,0,0,0,8,2,0,3,7,0,0,4,8,0,0,0,7,0,2,0,7,0,3,6,4,0,1,0,0,5,0,4,9,0,0,0];
				case "level_97":
					return [0,9,0,7,0,0,1,0,0,7,4,0,1,0,0,6,8,0,0,0,0,6,5,0,4,7,9,0,7,0,0,0,0,0,0,6,9,8,1,0,0,0,5,2,3,6,0,0,0,0,0,0,9,0,4,5,7,0,2,1,0,0,0,0,1,3,0,0,7,0,5,4,0,0,9,0,0,8,0,1,0];
				case "level_98":
					return [0,0,7,0,0,6,0,0,0,3,0,1,0,0,7,0,2,8,8,0,5,0,2,0,6,4,0,0,0,0,0,4,3,1,5,0,0,0,6,2,0,9,7,0,0,0,4,8,6,7,0,0,0,0,0,5,4,0,3,0,9,0,2,6,1,0,9,0,0,8,0,3,0,0,0,7,0,0,4,0,0];
				case "level_99":
					return [0,2,0,3,0,0,0,0,5,0,0,0,0,7,2,0,0,0,6,7,0,0,4,0,8,3,0,1,0,0,0,5,0,6,9,0,5,6,9,0,1,0,3,2,7,0,4,2,0,3,0,0,0,8,0,8,3,0,9,0,0,4,1,0,0,0,5,2,0,0,0,0,4,0,0,0,0,3,0,6,0];
				case "level_100":
					return [4,3,0,0,2,8,1,0,0,0,0,0,0,1,4,0,0,8,6,0,0,0,0,5,2,0,0,0,8,9,0,6,0,0,0,4,7,0,6,1,0,3,8,0,2,1,0,0,0,4,0,6,3,0,0,0,4,7,0,0,0,0,5,9,0,0,4,8,0,0,0,0,0,0,1,5,9,0,0,6,3];
				case "level_101":
					return [2,0,9,0,0,0,8,0,4,0,0,4,0,0,2,5,6,0,0,0,1,4,6,0,0,9,0,0,0,3,0,0,5,0,8,0,6,8,0,9,0,1,0,4,5,0,1,0,6,0,0,7,0,0,0,4,0,0,2,6,9,0,0,0,2,6,7,0,0,4,0,0,9,0,8,0,0,0,6,0,1];
				case "level_102":
					return [0,2,0,3,0,8,0,4,0,0,0,8,4,0,0,0,7,3,4,0,3,9,0,7,0,0,0,1,0,0,8,0,0,0,6,0,2,6,0,0,0,0,0,5,1,0,3,0,0,0,6,0,0,4,0,0,0,6,0,9,2,0,5,5,4,0,0,0,2,9,0,0,0,1,0,5,0,3,0,8,0];
				case "level_103":
					return [0,0,0,1,6,4,0,0,5,6,0,0,0,0,0,0,2,0,0,5,0,2,0,8,0,9,6,2,0,6,8,0,0,5,0,7,1,0,0,7,0,9,0,0,3,7,0,5,0,0,6,9,0,1,3,8,0,6,0,5,0,1,0,0,6,0,0,0,0,0,0,8,9,0,0,3,8,7,0,0,0];
				case "level_104":
					return [0,3,0,0,0,0,1,4,0,0,0,0,1,0,3,0,0,0,0,0,1,6,7,8,0,2,5,7,6,0,4,8,0,0,1,2,1,0,0,0,0,0,0,0,4,9,4,0,0,5,1,0,3,8,3,1,0,8,2,7,4,0,0,0,0,0,3,0,5,0,0,0,0,5,6,0,0,0,0,7,0];
				case "level_105":
					return [0,0,0,0,0,0,0,7,0,9,0,6,3,5,0,1,0,2,8,0,0,0,1,9,0,0,0,4,0,0,0,0,0,6,0,8,6,8,7,1,0,5,2,4,3,1,0,3,0,0,0,0,0,7,0,0,0,9,3,0,0,0,1,3,0,1,0,2,7,4,0,5,0,9,0,0,0,0,0,0,0];
				case "level_106":
					return [5,0,0,0,0,0,1,0,0,0,0,0,6,5,7,0,0,2,0,0,2,1,0,4,9,0,5,1,5,0,4,0,0,0,2,8,6,0,0,8,0,9,0,0,3,8,2,0,0,0,5,0,9,6,3,0,4,5,0,2,6,0,0,9,0,0,3,4,8,0,0,0,0,0,5,0,0,0,0,0,4];
				case "level_107":
					return [1,0,0,0,0,0,0,3,0,0,0,4,3,0,0,0,0,0,2,3,0,7,4,0,5,6,9,6,4,0,0,0,3,2,9,0,0,8,0,1,0,6,0,7,0,0,2,3,5,0,0,0,8,1,8,6,9,0,5,7,0,1,2,0,0,0,0,0,8,9,0,0,0,5,0,0,0,0,0,0,6];
				case "level_108":
					return [0,0,9,0,3,0,0,0,1,0,0,1,9,2,6,3,0,0,0,0,0,1,0,0,2,8,0,0,0,2,0,8,1,0,0,3,1,0,5,0,0,0,8,0,7,6,0,0,4,7,0,9,0,0,0,7,6,0,0,5,0,0,0,0,0,3,8,6,7,5,0,0,5,0,0,0,1,0,7,0,0];
				case "level_109":
					return [0,0,0,4,0,3,0,0,0,0,1,9,6,8,7,0,0,3,3,5,0,0,0,0,0,4,0,0,3,1,0,6,5,8,7,0,0,0,5,0,0,0,3,0,0,0,4,6,3,9,0,2,5,0,0,8,0,0,0,0,0,9,7,5,0,0,8,1,6,4,3,0,0,0,0,9,0,4,0,0,0];
				case "level_110":
					return [0,0,0,5,6,0,0,7,9,0,0,0,0,9,2,0,1,0,0,6,9,8,0,0,0,0,0,0,2,4,7,0,0,1,9,0,3,0,0,0,2,0,0,0,5,0,7,8,0,0,5,2,4,0,0,0,0,0,0,6,4,3,0,0,4,0,9,7,0,0,0,0,6,8,0,0,5,4,0,0,0];
				case "level_111":
					return [0,0,8,0,0,4,0,6,0,6,0,0,8,2,0,7,0,9,9,0,0,3,7,0,0,8,4,0,3,7,2,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,7,8,5,0,5,2,0,0,4,3,0,0,8,8,0,6,0,1,5,0,0,3,0,9,0,6,0,0,1,0,0];
				case "level_112":
					return [0,0,3,0,0,0,2,9,1,0,0,9,8,0,0,3,0,0,0,1,0,3,9,0,5,8,0,0,0,0,0,3,5,0,1,0,0,0,0,4,0,7,0,0,0,0,3,0,2,6,0,0,0,0,3,9,2,0,7,8,0,6,0,0,0,4,0,0,9,7,0,0,6,8,7,0,0,0,9,0,0];
				case "level_113":
					return [0,5,4,0,2,6,0,0,9,0,0,0,7,9,0,8,2,0,0,0,7,4,0,0,0,0,0,0,0,0,0,4,0,9,5,6,9,0,3,6,0,7,2,0,8,6,1,5,0,8,0,0,0,0,0,0,0,0,0,9,4,0,0,0,6,8,0,7,3,0,0,0,3,0,0,8,1,0,6,7,0];
				case "level_114":
					return [0,0,7,0,0,5,0,2,0,0,0,0,0,1,3,9,0,0,8,0,3,0,2,9,0,1,0,9,6,0,0,7,0,3,0,0,0,7,4,1,0,8,2,9,0,0,0,1,0,3,0,0,7,8,0,1,0,5,6,0,8,0,7,0,0,6,3,9,0,0,0,0,0,3,0,4,0,0,5,0,0];
				case "level_115":
					return [9,0,0,0,7,6,8,0,1,0,8,0,1,9,0,5,0,0,0,6,3,0,0,0,0,0,0,6,4,8,3,0,0,0,7,5,0,0,0,0,0,0,0,0,0,3,2,0,0,0,7,9,4,6,0,0,0,0,0,0,4,9,0,0,0,6,0,1,8,0,5,0,8,0,2,7,5,0,0,0,3];
				case "level_116":
					return [3,0,6,8,2,0,5,1,0,4,0,2,0,0,0,0,0,3,0,0,0,1,0,3,0,6,4,8,0,5,2,0,0,0,9,0,0,3,0,0,0,0,0,5,0,0,2,0,0,0,1,3,0,8,2,6,0,3,0,5,0,0,0,7,0,0,0,0,0,8,0,9,0,8,3,0,4,9,6,0,5];
				case "level_117":
					return [7,3,0,0,0,5,0,0,8,0,0,5,9,1,8,0,4,0,0,4,9,0,0,0,0,1,0,0,5,0,0,2,0,0,0,9,6,0,2,0,0,0,8,0,4,9,0,0,0,8,0,0,7,0,0,8,0,0,0,0,2,6,0,0,9,0,3,6,2,7,0,0,3,0,0,8,0,0,0,9,1];
				case "level_118":
					return [0,0,1,8,6,9,3,0,0,4,0,0,0,0,1,9,5,0,0,9,0,3,5,0,0,0,0,8,0,9,1,2,0,0,0,0,7,0,2,0,0,0,8,0,5,0,0,0,0,8,7,4,0,1,0,0,0,0,3,6,0,8,0,0,2,5,7,0,0,0,0,9,0,0,8,4,9,2,5,0,0];
				case "level_119":
					return [2,8,9,0,0,0,0,0,4,6,0,0,0,9,7,0,0,5,0,0,0,0,0,2,0,1,0,0,7,0,0,0,3,4,0,6,3,0,8,7,0,4,1,0,2,1,0,5,6,0,0,0,8,0,0,2,0,3,0,0,0,0,0,4,0,0,2,6,0,0,0,7,8,0,0,0,0,0,2,6,1];
				case "level_120":
					return [0,2,7,0,0,6,3,0,5,0,6,0,0,0,8,0,0,0,0,1,3,0,5,0,0,8,9,0,0,0,0,9,7,0,2,1,0,8,0,5,0,4,0,6,0,9,3,0,8,6,0,0,0,0,1,9,0,0,7,0,5,4,0,0,0,0,6,0,0,0,9,0,2,0,8,4,0,0,7,3,0];
				case "level_121":
					return [9,0,1,4,0,7,0,0,3,0,4,5,0,0,0,0,6,0,0,2,6,3,9,0,0,0,0,5,0,0,0,0,0,3,4,0,0,0,0,7,2,8,0,0,0,0,9,8,0,0,0,0,0,2,0,0,0,0,3,4,1,2,0,0,1,0,0,0,0,9,8,0,2,0,0,8,0,1,4,0,5];
				case "level_122":
					return [9,7,0,0,4,3,2,0,0,1,0,0,0,0,5,0,7,8,0,0,0,2,8,7,0,9,4,2,0,5,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,9,0,2,5,8,0,7,3,6,0,0,0,7,2,0,4,0,0,0,0,9,0,0,1,9,2,0,0,6,7];
				case "level_123":
					return [8,0,0,0,0,0,0,2,0,3,0,0,2,0,6,5,0,0,0,2,0,4,1,0,3,0,7,4,5,0,0,0,8,0,7,0,1,0,7,0,2,0,8,0,9,0,6,0,3,0,0,0,5,2,5,0,3,0,9,2,0,4,0,0,0,6,1,0,5,0,0,8,0,8,0,0,0,0,0,0,5];
				case "level_124":
					return [0,9,0,6,0,0,0,8,5,0,0,5,0,0,7,6,0,0,0,0,0,3,0,0,9,7,4,0,0,3,0,1,0,8,0,2,2,0,0,0,5,0,0,0,6,8,0,9,0,3,0,1,0,0,9,6,8,0,0,2,0,0,0,0,0,7,5,0,0,2,0,0,5,3,0,0,0,8,0,4,0];
				case "level_125":
					return [1,5,0,0,6,0,9,0,4,0,0,0,8,0,0,0,0,1,0,7,3,4,0,0,6,0,2,2,1,0,3,8,0,0,0,0,3,0,0,9,0,4,0,0,8,0,0,0,0,1,6,0,5,7,7,0,6,0,0,8,2,9,0,8,0,0,0,0,3,0,0,0,5,0,2,0,9,0,0,1,3];
				case "level_126":
					return [0,0,4,5,0,9,2,3,0,0,0,0,0,0,2,4,0,1,0,1,0,0,0,0,0,6,0,0,0,7,2,0,4,0,1,3,1,0,3,0,8,0,9,0,2,9,2,0,1,0,7,5,0,0,0,6,0,0,0,0,0,5,0,7,0,8,4,0,0,0,0,0,0,3,2,8,0,6,1,0,0];
				case "level_127":
					return [2,0,0,0,0,8,0,1,9,0,0,0,0,5,1,8,0,0,0,8,0,2,4,0,3,5,0,0,9,0,7,0,3,5,4,0,0,0,0,0,6,0,0,0,0,0,6,3,8,0,5,0,2,0,0,5,6,0,1,7,0,3,0,0,0,7,4,8,0,0,0,0,9,1,0,5,0,0,0,0,8];
				case "level_128":
					return [1,0,0,0,0,0,5,0,9,0,0,3,5,1,0,6,4,8,8,0,6,3,0,0,0,0,0,7,4,0,1,2,0,0,0,0,0,0,9,4,0,3,2,0,0,0,0,0,0,7,9,0,1,4,0,0,0,0,0,6,3,0,2,5,3,7,0,4,8,1,0,0,9,0,2,0,0,0,0,0,5];
				case "level_129":
					return [0,0,0,0,0,6,0,9,7,5,7,0,0,0,0,0,0,1,1,8,9,0,2,4,0,3,0,0,0,0,0,8,5,3,0,2,0,5,0,2,0,9,0,7,0,8,0,2,3,7,0,0,0,0,0,9,0,1,3,0,2,6,4,3,0,0,0,0,0,0,1,5,4,6,0,9,0,0,0,0,0];
				case "level_130":
					return [0,0,0,1,0,0,0,0,8,0,0,6,4,0,2,0,7,0,7,8,0,0,5,0,2,0,1,0,7,5,6,1,0,0,0,0,9,6,0,0,0,0,0,8,7,0,0,0,0,9,3,1,6,0,2,0,9,0,7,0,0,3,6,0,3,0,2,0,1,8,0,0,8,0,0,0,0,9,0,0,0];
				case "level_131":
					return [0,0,1,4,0,0,5,8,0,0,3,0,1,7,2,0,0,4,0,7,0,0,0,0,0,3,2,0,0,2,0,6,0,0,4,0,1,0,3,0,0,0,9,0,6,0,5,0,0,1,0,2,0,0,6,9,0,0,0,0,0,1,0,5,0,0,6,9,8,0,2,0,0,2,7,0,0,1,8,0,0];
				case "level_132":
					return [0,0,4,3,0,0,0,0,0,0,8,0,4,1,0,0,6,0,0,5,0,0,0,0,1,2,4,9,2,0,1,0,0,5,0,0,5,3,0,6,0,8,0,4,2,0,0,6,0,0,3,0,1,8,7,4,5,0,0,0,0,8,0,0,1,0,0,7,6,0,9,0,0,0,0,0,0,4,2,0,0];
				case "level_133":
					return [0,3,6,0,0,8,0,0,4,0,0,0,0,0,0,1,6,0,0,8,2,0,7,1,0,3,0,0,0,0,4,1,0,0,9,7,0,0,3,7,9,5,8,0,0,7,1,0,0,8,2,0,0,0,0,5,0,1,2,0,6,8,0,0,6,8,0,0,0,0,0,0,9,0,0,8,0,0,5,4,0];
				case "level_134":
					return [5,7,0,0,0,0,1,3,4,0,0,9,0,0,5,7,0,8,0,0,0,0,0,0,5,0,2,0,8,5,0,3,1,0,0,0,0,0,7,5,0,2,4,0,0,0,0,0,6,4,0,8,7,0,9,0,4,0,0,0,0,0,0,7,0,8,9,0,0,2,0,0,1,5,6,0,0,0,0,4,7];
				case "level_135":
					return [5,8,0,0,0,0,0,4,9,0,0,4,3,0,0,0,8,0,0,0,0,1,0,0,5,0,6,1,4,0,6,0,0,8,0,0,3,6,0,9,0,1,0,7,2,0,0,2,0,0,3,0,9,1,4,0,8,0,0,9,0,0,0,0,3,0,0,0,4,7,0,0,2,5,0,0,0,0,0,1,4];
				case "level_136":
					return [0,3,9,0,0,0,5,6,0,0,0,5,2,4,0,1,0,0,0,0,0,3,0,9,0,0,0,0,9,6,8,0,3,4,2,0,2,0,0,0,6,0,0,0,7,0,8,4,9,0,2,6,5,0,0,0,0,6,0,7,0,0,0,0,0,1,0,9,8,2,0,0,0,2,7,0,0,0,9,4,0];
				case "level_137":
					return [0,3,0,6,0,8,9,0,0,8,0,7,0,2,0,0,0,0,0,0,6,0,1,3,0,8,2,4,0,0,2,0,0,3,0,8,0,0,5,0,3,0,1,0,0,3,0,9,0,0,7,0,0,5,7,2,0,9,5,0,8,0,0,0,0,0,0,6,0,7,0,4,0,0,3,8,0,4,0,2,0];
				case "level_138":
					return [4,0,0,6,0,0,0,1,0,5,0,0,7,4,0,3,2,0,0,7,0,2,5,0,0,0,0,0,2,0,0,1,0,7,0,8,7,4,0,3,0,5,0,9,1,1,0,3,0,2,0,0,5,0,0,0,0,0,7,2,0,8,0,0,3,1,0,8,6,0,0,5,0,6,0,0,0,9,0,0,2];
				case "level_139":
					return [0,6,7,2,0,0,0,0,0,0,2,0,8,4,0,7,6,9,0,0,4,0,0,0,5,8,0,9,0,3,4,1,0,0,0,0,0,5,0,9,0,2,0,1,0,0,0,0,0,3,5,9,0,4,0,1,5,0,0,0,8,0,0,2,3,8,0,9,7,0,4,0,0,0,0,0,0,6,1,2,0];
				case "level_140":
					return [0,0,9,0,2,8,0,0,4,0,0,5,3,0,7,6,0,0,2,0,0,5,6,0,8,0,0,0,0,6,0,8,1,9,0,3,0,3,0,0,0,0,0,4,0,9,0,2,4,5,0,1,0,0,0,0,7,0,3,4,0,0,9,0,0,8,2,0,6,4,0,0,6,0,0,9,1,0,3,0,0];
				case "level_141":
					return [9,0,0,6,5,0,0,1,0,6,0,0,0,4,1,0,0,8,0,1,8,0,0,0,7,0,0,0,0,5,8,0,0,0,4,7,3,9,0,0,1,0,0,8,2,8,6,0,0,0,4,1,0,0,0,0,6,0,0,0,9,7,0,2,0,0,1,7,0,0,0,4,0,4,0,0,9,5,0,0,6];
				case "level_142":
					return [4,0,0,3,6,0,0,0,0,9,5,0,0,8,4,0,0,0,0,0,0,0,0,5,4,0,1,6,0,9,0,0,8,7,0,4,0,1,0,0,7,0,0,8,0,7,0,4,6,0,0,2,0,3,5,0,3,9,0,0,0,0,0,0,0,0,8,5,0,0,3,6,0,0,0,0,3,7,0,0,2];
				case "level_143":
					return [0,0,0,0,2,8,9,0,0,0,0,0,9,5,0,3,1,0,9,0,7,1,0,0,0,0,0,4,0,9,5,0,0,2,0,3,0,5,0,0,4,0,0,7,0,6,0,8,0,0,2,4,0,9,0,0,0,0,0,3,1,0,8,0,8,2,0,1,5,0,0,0,0,0,6,4,8,0,0,0,0];
				case "level_144":
					return [0,7,0,0,0,8,0,0,0,0,3,1,0,5,0,0,0,7,0,0,0,7,1,2,8,4,0,0,0,6,0,7,9,4,3,0,0,4,9,0,0,0,7,1,0,0,1,2,4,3,0,5,0,0,0,5,7,6,9,1,0,0,0,1,0,0,0,2,0,6,7,0,0,0,0,8,0,0,0,9,0];
				case "level_145":
					return [2,9,1,0,0,8,0,0,0,4,0,0,3,0,0,0,0,8,0,7,3,0,0,2,0,6,0,1,0,2,0,7,0,0,0,5,0,0,8,0,3,0,9,0,0,7,0,0,0,5,0,8,0,2,0,1,0,9,0,0,3,2,0,3,0,0,0,0,4,0,0,9,0,0,0,7,0,0,6,4,1];
				case "level_146":
					return [0,0,4,0,5,0,8,0,2,0,0,7,4,2,0,0,5,0,0,2,0,8,0,0,3,0,0,9,8,0,7,0,0,0,3,0,0,0,5,9,0,8,6,0,0,0,3,0,0,0,4,0,1,8,0,0,9,0,0,6,0,4,0,0,7,0,0,4,5,2,0,0,2,0,3,0,9,0,5,0,0];
				case "level_147":
					return [0,0,6,4,9,0,0,0,7,0,0,4,0,3,7,2,0,0,7,2,0,0,0,0,0,8,0,0,9,0,2,0,0,8,0,3,6,0,1,0,7,0,5,0,2,4,0,2,0,0,3,0,7,0,0,4,0,0,0,0,0,6,8,0,0,5,7,8,0,3,0,0,3,0,0,0,6,9,4,0,0];
				case "level_148":
					return [6,0,0,8,7,0,0,0,0,0,0,2,0,0,9,0,6,7,0,9,0,3,1,6,0,8,0,0,6,3,9,4,0,0,0,0,0,4,5,0,0,0,7,3,0,0,0,0,0,3,5,9,2,0,0,3,0,2,6,4,0,7,0,4,7,0,5,0,0,6,0,0,0,0,0,0,8,1,0,0,3];
				case "level_149":
					return [0,0,5,0,2,1,0,4,0,4,6,0,0,0,0,0,0,9,0,3,8,0,5,0,0,0,6,6,1,0,8,3,0,0,0,0,8,0,4,0,1,0,6,0,5,0,0,0,0,6,9,0,8,2,5,0,0,0,7,0,8,9,0,1,0,0,0,0,0,0,6,7,0,8,0,3,4,0,5,0,0];
				case "level_150":
					return [0,0,1,4,0,6,9,0,0,0,6,8,9,0,1,4,2,0,0,0,0,0,7,0,0,0,0,7,5,0,6,0,3,0,0,8,0,8,0,0,9,0,0,1,0,9,0,0,8,0,5,0,6,3,0,0,0,0,6,0,0,0,0,0,2,7,1,0,9,8,4,0,0,0,6,5,0,8,3,0,0];
				case "level_151":
					return [0,0,2,6,0,7,0,4,3,0,0,0,0,0,0,0,6,0,0,0,6,2,0,8,7,5,0,3,6,0,0,0,4,0,9,0,7,0,8,5,0,1,6,0,4,0,2,0,3,0,0,0,1,7,0,8,7,4,0,3,9,0,0,0,4,0,0,0,0,0,0,0,9,1,0,7,0,2,4,0,0];
				case "level_152":
					return [0,0,0,8,4,2,7,0,9,0,0,6,0,0,3,4,0,2,2,0,9,0,7,1,0,8,0,0,3,8,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,8,9,0,0,6,0,9,8,0,2,0,5,8,0,2,7,0,0,9,0,0,4,0,3,2,1,5,0,0,0];
				case "level_153":
					return [5,0,0,0,0,0,0,2,8,0,2,0,0,1,3,4,0,0,0,0,8,2,7,0,3,0,0,0,7,5,0,0,8,0,0,1,0,8,6,0,2,0,9,4,0,2,0,0,7,0,0,8,3,0,0,0,7,0,5,2,6,0,0,0,0,3,1,4,0,0,7,0,4,5,0,0,0,0,0,0,3];
				case "level_154":
					return [0,7,0,0,4,0,8,0,1,0,2,0,5,0,0,7,3,0,0,0,6,0,7,0,5,0,0,0,4,8,0,1,0,3,0,0,9,0,2,6,0,4,1,0,8,0,0,1,0,5,0,6,4,0,0,0,5,0,9,0,2,0,0,0,6,9,0,0,8,0,5,0,2,0,7,0,6,0,0,1,0];
				case "level_155":
					return [0,8,0,0,0,0,6,2,9,0,0,9,6,2,0,8,3,1,0,2,0,8,0,0,0,5,0,0,0,0,0,9,3,1,0,0,0,0,0,2,0,5,0,0,0,0,0,4,7,1,0,0,0,0,0,1,0,0,0,6,0,8,0,2,7,6,0,8,1,4,0,0,4,3,8,0,0,0,0,1,0];
				case "level_156":
					return [0,4,0,0,0,7,0,0,0,2,0,0,5,0,3,4,0,0,0,5,7,0,6,0,0,9,2,0,0,0,0,7,2,3,0,9,9,7,0,0,0,0,0,6,4,6,0,1,9,3,0,0,0,0,4,6,0,0,1,0,5,3,0,0,0,9,8,0,5,0,0,6,0,0,0,3,0,0,0,4,0];
				case "level_157":
					return [0,7,0,1,0,0,0,0,4,6,8,0,0,5,0,2,1,0,0,0,0,0,8,7,0,0,0,3,0,0,0,4,0,6,9,0,4,6,9,0,3,0,1,7,8,0,5,7,0,1,0,0,0,2,0,0,0,4,7,0,0,0,0,0,2,1,0,9,0,0,5,3,5,0,0,0,0,1,0,6,0];
				case "level_158":
					return [0,0,6,5,8,7,3,0,1,0,5,0,0,0,6,4,0,0,2,0,7,3,0,0,8,0,0,0,6,9,0,2,1,0,0,0,0,0,5,0,0,0,1,0,0,0,0,0,6,3,0,9,8,0,0,0,4,0,0,2,7,0,3,0,0,1,7,0,0,0,4,0,6,0,3,4,9,8,2,0,0];
				case "level_159":
					return [4,0,0,7,8,0,0,0,9,7,0,0,4,9,3,1,0,6,0,6,0,0,1,0,0,0,0,0,0,6,0,4,0,0,0,7,5,0,7,0,0,0,4,0,2,8,0,0,0,2,0,6,0,0,0,0,0,0,3,0,0,8,0,2,0,4,8,7,1,0,0,5,3,0,0,0,5,9,0,0,4];
				case "level_160":
					return [0,0,8,0,0,2,0,0,0,6,0,7,0,9,0,0,8,0,0,0,0,8,6,1,4,0,2,3,0,0,0,8,5,7,0,4,5,0,4,0,0,0,6,0,8,1,0,6,4,7,0,0,0,9,8,0,9,3,5,6,0,0,0,0,6,0,0,1,0,8,0,3,0,0,0,2,0,0,5,0,0];
				case "level_161":
					return [0,5,4,0,0,0,0,8,0,0,0,1,4,8,3,0,5,0,6,2,0,0,0,1,0,0,3,0,1,0,0,9,0,0,0,4,7,0,9,0,0,0,3,0,5,4,0,0,0,3,0,0,6,0,2,0,0,3,0,0,0,4,8,0,4,0,2,7,9,6,0,0,0,3,0,0,0,0,9,7,0];
				case "level_162":
					return [0,0,0,6,0,1,0,0,0,2,8,0,0,0,0,0,3,6,3,0,0,4,2,0,0,0,9,1,5,0,3,0,2,0,4,8,0,0,6,0,1,0,3,0,0,8,3,0,7,0,4,0,2,1,9,0,0,0,8,3,0,0,5,5,1,0,0,0,0,0,7,2,0,0,0,2,0,7,0,0,0];
				case "level_163":
					return [0,0,0,3,0,2,0,0,0,2,0,0,0,0,0,0,3,7,0,3,0,9,6,1,5,0,4,9,0,6,7,1,0,4,0,3,0,0,3,0,0,0,7,0,0,7,0,8,0,5,3,1,0,2,3,0,2,1,4,6,0,7,0,5,9,0,0,0,0,0,0,6,0,0,0,2,0,5,0,0,0];
				case "level_164":
					return [5,0,8,6,0,0,4,2,0,0,0,0,2,0,0,0,0,8,4,0,0,0,0,8,6,1,0,0,6,0,0,0,0,3,4,5,3,1,0,0,0,0,0,7,6,7,4,2,0,0,0,0,9,0,0,5,4,3,0,0,0,0,9,6,0,0,0,0,5,0,0,0,0,3,1,0,0,6,5,0,4];
				case "level_165":
					return [0,0,1,0,5,6,0,0,0,0,9,5,0,1,2,6,4,0,0,0,2,7,0,0,0,0,5,0,0,0,0,6,3,0,9,1,0,2,0,0,0,0,0,8,0,3,1,0,2,9,0,0,0,0,1,0,0,0,0,9,7,0,0,0,6,7,5,3,0,1,2,0,0,0,0,4,7,0,8,0,0];
				case "level_166":
					return [0,4,0,0,0,5,0,9,8,0,0,0,0,1,8,5,0,0,5,0,0,4,2,0,7,0,1,9,0,0,6,0,7,1,0,2,0,0,0,0,3,0,0,0,0,3,0,7,5,0,1,0,0,4,1,0,3,0,8,6,0,0,7,0,0,6,2,5,0,0,0,0,8,9,0,1,0,0,0,5,0];
				case "level_167":
					return [0,4,0,0,0,0,0,7,6,2,6,0,8,0,0,0,0,0,9,0,0,3,5,0,2,4,1,0,5,9,7,1,0,0,0,0,6,0,0,2,0,5,0,0,7,0,0,0,0,6,9,5,1,0,8,3,5,0,9,4,0,0,2,0,0,0,0,0,2,0,3,8,4,7,0,0,0,0,0,9,0];
				case "level_168":
					return [0,3,2,0,0,7,0,4,1,0,0,5,0,0,6,0,3,0,1,4,7,0,8,3,0,0,0,9,0,0,0,0,0,0,5,0,5,6,3,0,0,0,4,8,2,0,7,0,0,0,0,0,0,9,0,0,0,9,4,0,1,7,5,0,5,0,7,0,0,3,0,0,7,1,0,3,0,0,9,6,0];
				case "level_169":
					return [0,5,1,0,4,7,0,0,2,0,0,0,0,0,0,7,0,0,0,0,7,3,6,8,0,0,5,5,0,0,0,0,4,0,9,3,7,0,2,5,0,1,8,0,6,8,9,0,6,0,0,0,0,7,9,0,0,4,5,2,3,0,0,0,0,5,0,0,0,0,0,0,4,0,0,1,7,0,5,6,0];
				case "level_170":
					return [0,5,8,0,1,0,3,0,2,3,0,0,0,0,5,9,0,0,0,0,0,4,7,0,0,0,0,0,7,3,0,5,0,0,0,8,4,1,9,0,2,0,7,5,6,2,0,0,0,4,0,1,9,0,0,0,0,0,6,7,0,0,0,0,0,7,5,0,0,0,0,4,9,0,6,0,3,0,5,8,0];
				case "level_171":
					return [8,0,0,5,2,6,0,0,0,0,7,0,0,0,0,0,0,2,2,3,0,1,0,7,0,8,0,9,0,8,0,0,1,2,0,7,4,0,0,3,0,9,0,0,6,6,0,3,2,0,0,8,0,9,0,6,0,8,0,2,0,1,4,1,0,0,0,0,0,0,2,0,0,0,0,9,1,4,0,0,3];
				case "level_172":
					return [0,5,0,0,4,8,6,0,9,0,6,1,0,3,0,0,0,0,9,0,0,1,0,5,0,7,0,0,0,4,6,0,0,7,8,0,0,2,0,0,7,0,0,4,0,0,7,5,0,0,9,1,0,0,0,8,0,5,0,3,0,0,7,0,0,0,0,9,0,5,6,0,5,0,9,7,2,0,0,3,0];
				case "level_173":
					return [4,0,0,1,5,0,0,7,0,7,0,3,0,0,0,1,0,2,1,0,0,0,0,3,0,5,6,8,0,0,0,0,6,0,2,0,0,2,5,7,0,4,6,1,0,0,4,0,5,0,0,0,0,9,5,3,0,9,0,0,0,0,1,2,0,7,0,0,0,4,0,5,0,1,0,0,3,5,0,0,7];
				case "level_174":
					return [8,6,0,0,9,5,2,0,0,0,0,0,0,1,7,0,0,9,5,0,0,0,0,4,7,0,0,0,8,6,0,7,0,0,0,2,3,0,1,8,0,2,6,0,4,7,0,0,0,6,0,9,1,0,0,0,3,5,0,0,0,0,6,1,0,0,7,2,0,0,0,0,0,0,2,1,3,0,0,8,7];
				case "level_175":
					return [0,5,6,0,0,1,0,8,7,7,0,0,0,0,3,0,6,2,1,0,2,6,7,0,0,0,0,0,0,7,0,0,6,4,0,1,8,0,0,0,0,0,0,0,6,9,0,3,4,0,0,7,0,0,0,0,0,0,3,9,2,0,4,2,1,0,7,0,0,0,0,3,3,9,0,1,0,0,8,7,0];
				case "level_176":
					return [0,0,0,3,0,5,0,0,0,1,0,9,0,0,0,6,0,3,6,0,0,8,1,0,0,0,2,5,0,4,6,0,1,8,0,9,0,3,0,0,5,0,0,6,0,9,0,6,7,0,8,1,0,5,2,0,0,0,9,6,0,0,4,4,0,5,0,0,0,7,0,1,0,0,0,1,0,7,0,0,0];
				case "level_177":
					return [6,0,9,0,0,0,4,0,0,0,3,0,0,6,1,0,7,0,0,4,0,5,9,0,0,0,3,0,0,1,3,0,0,0,8,4,8,7,0,0,1,0,0,2,9,3,6,0,0,0,8,5,0,0,1,0,0,0,5,4,0,9,0,0,8,0,1,3,0,0,4,0,0,0,6,0,0,0,8,0,1];
				case "level_178":
					return [8,0,0,0,0,7,0,2,0,0,0,2,8,5,0,4,0,1,0,0,4,6,1,0,7,8,0,1,6,0,5,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,1,0,3,8,0,5,3,0,7,6,8,0,0,2,0,8,0,9,3,6,0,0,0,4,0,2,0,0,0,0,9];
				case "level_179":
					return [0,5,0,7,0,0,0,0,2,0,8,1,4,3,2,0,7,0,0,3,0,0,0,8,6,4,0,0,0,0,1,6,0,0,9,7,0,1,0,0,0,0,0,2,0,3,9,0,0,8,7,0,0,0,0,4,8,6,0,0,0,5,0,0,6,0,3,9,5,7,8,0,5,0,0,0,0,4,0,1,0];
				case "level_180":
					return [0,4,6,0,2,8,0,0,3,9,0,0,0,0,0,0,4,0,0,0,5,7,0,4,0,9,0,5,0,0,6,0,0,0,8,4,0,7,1,0,8,0,9,2,0,4,3,0,0,0,9,0,0,1,0,6,0,8,0,5,4,0,0,0,9,0,0,0,0,0,0,8,8,0,0,3,7,0,6,1,0];
				case "level_181":
					return [8,0,1,7,0,5,0,3,0,0,0,3,0,2,0,0,0,0,0,0,0,1,0,8,0,4,0,4,0,0,0,0,7,9,1,0,7,0,9,0,5,0,3,0,4,0,3,8,9,0,0,0,0,5,0,8,0,5,0,6,0,0,0,0,0,0,0,9,0,4,0,0,0,2,0,8,0,4,7,0,6];
				case "level_182":
					return [3,0,1,0,8,0,0,0,0,0,9,0,0,5,1,0,2,0,0,2,6,3,0,0,4,0,1,1,0,0,0,0,0,0,4,2,7,0,0,8,0,4,0,0,5,4,3,0,0,0,0,0,0,8,6,0,7,0,0,9,5,1,0,0,4,0,1,6,0,0,7,0,0,0,0,0,4,0,8,0,9];
				case "level_183":
					return [4,1,0,2,0,0,3,0,0,0,5,0,1,3,0,0,2,9,3,0,9,0,5,0,0,0,0,0,0,0,3,0,0,4,0,0,9,0,8,4,2,1,5,0,6,0,0,2,0,0,7,0,0,0,0,0,0,0,1,0,9,0,3,1,7,0,0,9,8,0,6,0,0,0,5,0,0,3,0,1,7];
				case "level_184":
					return [0,5,0,0,0,8,4,7,0,0,3,0,7,4,0,5,0,0,2,7,0,0,0,0,0,9,3,0,8,0,0,0,7,2,0,0,1,0,5,2,0,3,9,0,7,0,0,9,1,0,0,0,6,0,5,9,0,0,0,0,0,3,4,0,0,3,0,7,5,0,2,0,0,1,7,4,0,0,0,5,0];
				case "level_185":
					return [0,0,0,0,0,4,5,8,0,5,9,0,0,8,2,0,0,0,0,1,0,6,5,0,0,0,0,0,5,1,0,0,9,3,6,0,2,0,0,0,6,0,0,0,7,0,3,6,2,0,0,4,9,0,0,0,0,0,9,5,0,3,0,0,0,0,3,2,0,0,4,8,0,7,3,8,0,0,0,0,0];
				case "level_186":
					return [3,0,0,0,1,7,0,0,9,0,0,0,2,0,8,0,0,0,8,0,9,0,0,0,4,0,1,4,0,7,1,0,9,6,0,2,0,9,0,0,2,0,0,8,0,2,0,1,7,0,5,9,0,4,1,0,5,0,0,0,2,0,6,0,0,0,5,0,1,0,0,0,6,0,0,9,4,0,0,0,3];
				case "level_187":
					return [0,2,0,8,5,6,0,0,7,0,5,0,0,0,0,0,2,6,0,0,8,7,0,0,9,1,0,0,0,6,0,3,0,0,7,0,8,0,2,0,0,0,4,0,3,0,9,0,0,8,0,6,0,0,0,6,5,0,0,8,1,0,0,3,4,0,0,0,0,0,8,0,9,0,0,3,4,1,0,6,0];
				case "level_188":
					return [0,0,0,0,0,0,1,6,0,0,8,0,0,0,1,7,2,0,6,0,7,0,0,0,3,9,4,7,2,0,0,6,9,0,0,0,0,6,0,8,0,4,0,7,0,0,0,0,3,5,0,0,4,2,5,3,6,0,0,0,4,0,7,0,7,2,4,0,0,0,1,0,0,4,8,0,0,0,0,0,0];
				case "level_189":
					return [0,9,6,2,8,0,0,7,3,0,0,0,0,9,3,8,0,0,0,0,0,0,0,0,0,0,1,9,6,0,0,0,5,0,4,0,0,2,7,4,0,1,9,3,0,0,3,0,9,0,0,0,1,8,4,0,0,0,0,0,0,0,0,0,0,9,7,1,0,0,0,0,2,7,0,0,4,6,1,8,0];
				case "level_190":
					return [6,0,0,2,0,0,0,0,8,8,0,0,0,0,0,6,3,5,0,0,3,8,6,0,2,9,1,0,0,0,0,8,1,3,0,0,0,0,0,4,0,9,0,0,0,0,0,8,5,7,0,0,0,0,5,8,6,0,9,2,7,0,0,9,7,2,0,0,0,0,0,6,4,0,0,0,0,6,0,0,9];
				case "level_191":
					return [6,0,9,0,0,4,2,0,0,8,1,0,0,0,0,0,0,4,0,7,0,1,8,2,0,0,6,7,0,0,0,4,0,6,0,0,0,4,3,0,0,0,8,1,0,0,0,6,0,1,0,0,0,5,3,0,0,4,9,6,0,5,0,9,0,0,0,0,0,0,6,3,0,0,4,5,0,0,7,0,2];
				case "level_192":
					return [0,0,0,0,0,1,6,0,0,1,0,0,0,0,0,0,8,0,9,7,5,0,6,2,0,4,1,7,0,4,1,0,0,0,9,6,2,0,0,9,0,8,0,0,3,3,8,0,0,0,5,1,0,4,8,4,0,2,5,0,7,3,9,0,9,0,0,0,0,0,0,5,0,0,7,3,0,0,0,0,0];
				case "level_193":
					return [4,9,0,0,0,0,8,5,1,0,0,0,0,0,0,9,0,6,0,0,2,0,0,6,3,0,4,0,4,3,0,9,8,0,0,0,0,0,9,2,0,5,4,0,0,0,0,0,1,7,0,5,3,0,3,0,4,5,0,0,6,0,0,2,0,5,0,0,0,0,0,0,9,7,1,0,0,0,0,4,5];
				case "level_194":
					return [0,6,3,0,0,7,0,0,8,0,0,0,0,0,0,5,3,0,0,7,9,0,1,5,0,6,0,0,0,0,8,5,0,0,4,1,0,0,6,1,4,2,7,0,0,1,5,0,0,7,9,0,0,0,0,2,0,5,9,0,3,7,0,0,3,7,0,0,0,0,0,0,4,0,0,7,0,0,2,8,0];
				case "level_195":
					return [6,1,0,0,7,3,0,0,5,5,4,0,0,0,6,2,0,0,0,0,0,0,0,0,0,3,4,0,0,0,2,3,0,7,0,9,0,5,0,7,9,8,0,6,0,3,0,7,0,6,1,0,0,0,4,6,0,0,0,0,0,0,0,0,0,9,6,0,0,0,8,2,8,0,0,3,1,0,0,4,6];
				case "level_196":
					return [1,0,5,4,9,0,2,3,8,0,3,0,2,0,0,0,0,0,0,0,8,0,0,0,0,0,9,2,0,1,0,0,9,0,6,5,4,0,0,8,0,1,0,0,2,3,5,0,6,0,0,8,0,7,6,0,0,0,0,0,1,0,0,0,0,0,0,0,6,0,7,0,8,9,3,0,7,4,5,0,6];
				case "level_197":
					return [0,2,0,8,0,0,7,0,4,8,0,0,0,1,3,6,5,0,0,0,1,2,0,0,9,0,0,0,3,2,0,0,0,0,9,8,1,0,0,0,0,0,0,0,6,9,4,0,0,0,0,1,3,0,0,0,3,0,0,4,8,0,0,0,8,5,6,9,0,0,0,1,2,0,7,0,0,5,0,6,0];
				case "level_198":
					return [0,2,6,4,5,0,0,8,3,0,0,0,0,0,0,0,0,5,0,0,0,0,6,8,9,0,0,2,6,0,0,0,9,0,1,0,0,1,9,6,0,5,8,3,0,0,5,0,7,0,0,0,4,9,0,0,2,1,9,0,0,0,0,6,0,0,0,0,0,0,0,0,1,8,0,0,2,3,4,9,0];
				case "level_199":
					return [0,0,6,0,5,1,2,0,0,1,5,7,0,0,0,8,0,0,0,0,0,0,0,9,0,1,0,0,8,0,0,0,5,7,0,3,7,0,1,2,0,6,9,0,8,2,0,5,9,0,0,0,6,0,0,7,0,1,0,0,0,0,0,0,0,2,0,0,0,1,8,4,0,0,3,6,4,0,5,0,0];
				case "level_200":
					return [0,9,8,0,1,0,0,2,0,0,0,0,9,0,8,5,1,4,0,0,0,3,2,0,7,0,0,0,8,9,0,6,3,2,4,0,0,0,0,0,0,0,0,0,0,0,1,2,4,5,0,8,3,0,0,0,3,0,4,2,0,0,0,9,6,4,7,0,5,0,0,0,0,2,0,0,9,0,4,7,0];
				case "level_201":
					return [0,0,0,0,9,0,0,0,0,0,1,0,4,0,5,0,9,0,3,4,0,2,0,6,0,8,7,9,0,1,5,0,4,2,0,0,6,0,0,0,2,0,0,0,4,0,0,4,1,0,9,8,0,5,7,3,0,6,0,2,0,4,9,0,2,0,9,0,3,0,6,0,0,0,0,0,8,0,0,0,0];
				case "level_202":
					return [9,5,4,0,0,0,3,0,8,0,3,2,0,0,0,0,0,0,0,8,6,3,0,0,0,1,0,0,0,0,5,9,0,0,3,6,0,4,0,2,0,3,0,8,0,8,6,0,0,4,7,0,0,0,0,2,0,0,0,1,8,6,0,0,0,0,0,0,0,1,4,0,4,0,8,0,0,0,5,7,3];
				case "level_203":
					return [0,3,0,0,0,7,4,0,5,4,0,0,6,5,0,0,0,0,0,0,7,1,8,4,6,0,0,0,1,4,7,2,0,0,0,0,0,9,2,0,0,0,1,5,0,0,0,0,0,1,9,3,7,0,0,0,1,3,4,2,5,0,0,0,0,0,0,6,8,0,0,1,2,0,5,9,0,0,0,4,0];
				case "level_204":
					return [0,4,0,0,0,0,0,2,0,5,0,1,8,0,0,0,0,0,3,6,0,5,0,4,0,0,7,0,3,9,7,0,1,0,0,2,6,0,7,0,5,0,3,0,9,1,0,0,3,0,8,6,7,0,8,0,0,2,0,9,0,6,3,0,0,0,0,0,3,7,0,8,0,7,0,0,0,0,0,4,0];
				case "level_205":
					return [5,3,6,2,0,7,0,0,0,0,0,8,0,1,4,0,0,0,1,0,0,0,5,0,2,0,7,3,0,1,4,9,0,7,0,2,0,0,0,0,0,0,0,0,0,4,0,2,0,6,3,1,0,5,8,0,3,0,7,0,0,0,1,0,0,0,1,3,0,4,0,0,0,0,0,6,0,8,3,7,9];
				case "level_206":
					return [0,6,0,4,0,0,0,0,1,0,0,0,0,6,0,0,0,0,2,0,5,1,0,3,6,4,0,0,2,9,3,0,0,5,0,6,5,7,0,2,0,8,0,3,4,8,0,4,0,0,6,7,1,0,0,1,8,5,0,7,2,0,9,0,0,0,0,4,0,0,0,0,7,0,0,0,0,1,0,5,0];
				case "level_207":
					return [8,6,0,0,0,9,3,0,0,5,9,0,0,4,7,0,6,0,0,0,0,0,0,0,0,8,7,0,0,0,3,7,0,4,1,0,6,0,0,4,1,2,0,0,9,0,7,4,0,9,5,0,0,0,9,8,0,0,0,0,0,0,0,0,2,0,7,5,0,0,9,8,0,0,1,9,0,0,0,3,2];
				case "level_208":
					return [1,0,5,0,4,9,2,0,0,0,3,0,0,0,8,1,0,5,0,0,0,0,1,0,0,4,8,0,6,0,0,0,5,0,0,0,4,9,0,7,6,1,0,3,2,0,0,0,8,0,0,0,7,0,8,4,0,0,3,0,0,0,0,7,0,1,6,0,0,0,8,0,0,0,3,1,8,0,6,0,4];
				case "level_209":
					return [0,3,9,1,0,0,0,8,0,0,6,2,3,7,5,0,0,0,4,0,0,8,9,0,5,3,0,0,0,4,0,0,0,0,9,8,0,0,0,0,0,0,0,0,0,6,9,0,0,0,0,1,0,0,0,8,3,0,1,7,0,0,9,0,0,0,9,2,3,8,1,0,0,4,0,0,0,6,3,2,0];
				case "level_210":
					return [0,0,0,2,0,1,0,5,7,0,5,3,0,0,7,0,0,1,0,0,9,5,0,4,6,0,0,0,0,4,0,0,2,0,3,0,0,7,2,0,0,0,5,9,0,0,9,0,6,0,0,2,0,0,0,0,7,4,0,6,3,0,0,6,0,0,3,0,0,8,4,0,4,3,0,1,0,8,0,0,0];
				case "level_211":
					return [0,0,8,0,0,0,6,0,9,0,0,0,0,4,1,7,0,8,0,1,0,2,0,6,0,4,5,1,0,6,0,0,0,0,9,0,0,0,0,3,7,2,0,0,0,0,7,0,0,0,0,4,0,3,6,9,0,5,0,3,0,7,0,5,0,7,6,1,0,0,0,0,4,0,3,0,0,0,5,0,0];
				case "level_212":
					return [0,0,6,9,5,0,0,8,0,0,0,0,0,1,2,7,0,0,0,2,3,0,6,8,4,0,0,0,7,0,0,0,0,0,0,5,3,0,8,5,9,7,1,0,2,2,0,0,0,0,0,0,7,0,0,0,7,1,2,0,8,6,0,0,0,4,6,7,0,0,0,0,0,5,0,0,3,4,9,0,0];
				case "level_213":
					return [0,0,0,6,0,3,2,7,0,1,9,0,0,0,0,0,4,0,2,6,0,9,5,0,1,0,3,3,1,0,8,0,0,7,0,0,0,0,6,0,0,0,3,0,0,0,0,9,0,0,7,0,1,6,6,0,8,0,7,1,0,3,2,0,3,0,0,0,0,0,5,7,0,5,2,3,0,8,0,0,0];
				case "level_214":
					return [0,0,4,0,9,7,0,0,0,0,6,9,0,4,3,7,2,0,0,0,3,5,0,0,0,0,9,0,0,0,0,7,8,0,6,4,0,3,0,0,0,0,0,1,0,8,4,0,3,6,0,0,0,0,4,0,0,0,0,6,5,0,0,0,7,5,9,8,0,4,3,0,0,0,0,2,5,0,1,0,0];
				case "level_215":
					return [4,9,0,0,0,5,0,0,0,0,0,5,0,7,0,0,4,0,0,3,0,1,9,4,0,5,0,0,0,9,8,4,0,0,2,0,0,5,7,0,0,0,4,1,0,0,6,0,0,1,7,3,0,0,0,7,0,2,6,9,0,3,0,0,2,0,0,3,0,7,0,0,0,0,0,7,0,0,0,6,1];
				case "level_216":
					return [0,9,1,8,5,0,2,0,3,0,0,8,0,9,7,0,0,1,0,0,0,0,2,0,6,9,8,7,8,2,0,0,0,0,0,0,3,0,0,0,0,0,0,0,4,0,0,0,0,0,0,8,5,2,1,2,7,0,3,0,0,0,0,9,0,0,7,6,0,1,0,0,8,0,5,0,4,9,3,2,0];
				case "level_217":
					return [9,0,8,0,0,5,0,6,0,5,0,2,0,7,3,0,0,9,0,0,0,0,0,0,3,0,8,0,0,0,6,3,0,0,7,4,0,0,9,7,4,1,5,0,0,3,7,0,0,5,2,0,0,0,8,0,5,0,0,0,0,0,0,1,0,0,3,2,0,8,0,5,0,4,0,5,0,0,1,0,6];
				case "level_218":
					return [0,0,0,0,9,3,5,0,4,9,4,5,8,0,0,0,3,2,0,1,0,0,2,0,0,9,0,0,0,4,0,1,2,0,0,6,0,0,6,0,0,0,4,0,0,8,0,0,4,5,0,9,0,0,0,5,0,0,4,0,0,6,0,4,3,0,0,0,7,1,5,9,6,0,9,1,3,0,0,0,0];
				case "level_219":
					return [0,0,1,7,0,0,0,0,0,8,0,0,3,9,0,0,0,4,2,0,0,0,0,0,6,9,7,4,2,0,5,0,0,3,0,0,7,1,0,2,0,3,0,6,5,0,0,6,0,0,4,0,8,1,1,7,4,0,0,0,0,0,6,3,0,0,0,4,7,0,0,2,0,0,0,0,0,5,7,0,0];
				case "level_220":
					return [0,9,0,0,0,7,0,0,0,0,4,3,0,8,0,0,0,9,0,0,0,9,3,6,7,5,0,0,0,2,0,9,1,5,4,0,0,5,1,0,0,0,9,3,0,0,3,6,5,4,0,8,0,0,0,8,9,2,1,3,0,0,0,3,0,0,0,6,0,2,9,0,0,0,0,7,0,0,0,1,0];
				case "level_221":
					return [0,0,0,0,0,4,0,7,0,8,0,0,0,1,7,0,0,2,3,1,7,0,0,0,0,0,5,0,5,0,0,0,1,6,0,3,7,0,3,2,0,8,5,0,4,1,0,2,4,0,0,0,8,0,2,0,0,0,0,0,9,5,7,6,0,0,8,9,0,0,0,1,0,3,0,7,0,0,0,0,0];
				case "level_222":
					return [0,0,3,7,8,0,2,0,5,0,6,0,0,0,1,0,0,4,0,0,7,2,6,0,3,1,0,2,3,0,9,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,5,0,9,7,0,9,4,0,5,3,1,0,0,1,0,0,8,0,0,0,3,0,3,0,8,0,9,7,4,0,0];
				case "level_223":
					return [6,1,0,0,7,8,0,4,2,0,0,9,0,0,0,0,0,0,0,0,0,9,6,0,0,0,1,1,6,0,0,0,0,0,0,8,3,8,5,1,0,2,4,7,6,4,0,0,0,0,0,0,3,5,5,0,0,0,1,9,0,0,0,0,0,0,0,0,0,8,0,0,9,3,0,6,2,0,0,1,7];
				case "level_224":
					return [1,0,0,3,0,0,0,4,0,0,3,2,0,0,0,5,0,0,0,7,8,4,0,0,0,0,1,3,1,0,0,6,0,0,2,5,0,0,7,9,0,5,8,0,0,5,8,0,0,4,0,0,1,9,8,0,0,0,0,9,1,6,0,0,0,1,0,0,0,9,5,0,0,6,0,0,0,1,0,0,7];
				case "level_225":
					return [0,6,0,5,0,0,0,9,0,8,0,5,0,0,2,0,0,1,7,2,4,0,0,9,0,0,0,0,4,2,0,8,0,0,3,0,0,0,9,0,5,0,7,0,0,0,8,0,0,3,0,9,2,0,0,0,0,8,0,0,1,4,6,4,0,0,7,0,0,5,0,2,0,5,0,0,0,6,0,7,0];
				case "level_226":
					return [4,2,0,0,0,0,0,0,0,3,0,0,2,5,0,0,8,1,0,0,9,1,0,0,0,4,3,6,0,5,0,2,9,0,0,0,0,1,0,7,6,5,0,3,0,0,0,0,8,1,0,5,0,2,9,7,0,0,0,1,6,0,0,1,4,0,0,8,2,0,0,7,0,0,0,0,0,0,0,1,4];
				case "level_227":
					return [2,0,9,0,1,0,0,8,0,0,4,8,0,0,0,0,7,0,1,0,0,0,3,6,4,0,0,0,8,6,2,9,0,0,0,0,4,2,0,0,6,0,0,1,8,0,0,0,0,8,7,2,3,0,0,0,2,9,4,0,0,0,1,0,6,0,0,0,0,8,5,0,0,1,0,0,5,0,7,0,2];
				case "level_228":
					return [0,4,0,5,0,3,0,7,0,3,6,0,7,0,4,0,5,9,0,0,0,0,1,0,0,0,0,2,0,1,3,0,8,6,0,0,6,0,0,0,7,0,0,0,4,0,0,7,6,0,2,8,0,3,0,0,0,0,3,0,0,0,0,9,1,0,4,0,7,0,6,5,0,3,0,2,0,6,0,8,0];
				case "level_229":
					return [9,6,0,0,1,0,2,0,0,2,0,8,0,0,0,7,0,0,0,1,0,0,3,4,0,0,8,4,0,2,6,9,0,0,0,0,0,8,6,0,4,0,1,2,0,0,0,0,0,2,7,3,0,6,6,0,0,9,8,0,0,1,0,0,0,4,0,0,0,5,0,2,0,0,1,0,5,0,0,6,7];
				case "level_230":
					return [0,0,0,5,0,0,9,0,1,3,0,0,8,0,0,0,7,0,0,7,1,0,0,0,4,3,0,0,3,5,9,0,0,0,0,7,0,9,8,4,0,5,2,6,0,2,0,0,0,0,8,5,4,0,0,1,2,0,0,0,3,5,0,0,8,0,0,0,3,0,0,6,7,0,3,0,0,4,0,0,0];
				case "level_231":
					return [0,0,5,1,3,0,0,0,9,0,7,0,0,0,0,6,8,0,0,9,0,0,8,0,2,0,5,0,0,0,0,6,2,5,4,0,3,5,0,0,7,0,0,9,6,0,6,7,5,1,0,0,0,0,5,0,1,0,9,0,0,6,0,0,3,6,0,0,0,0,2,0,9,0,0,0,4,7,3,0,0];
				case "level_232":
					return [0,2,0,0,6,9,5,0,0,0,7,0,3,0,4,0,8,0,0,0,6,7,8,0,0,9,0,0,8,0,0,9,1,3,2,0,3,0,0,0,0,0,0,0,5,0,6,2,5,7,0,0,1,0,0,4,0,0,3,5,2,0,0,0,9,0,6,0,8,0,5,0,0,0,8,2,1,0,0,3,0];
				case "level_233":
					return [2,0,0,7,9,0,0,0,3,0,0,3,0,1,4,0,0,5,0,5,0,0,0,0,9,1,0,8,0,5,0,0,3,0,7,0,6,0,1,0,7,0,8,0,2,0,4,0,8,0,0,3,0,9,0,8,7,0,0,0,0,9,0,1,0,0,5,4,0,7,0,0,5,0,0,0,3,7,0,0,8];
				case "level_234":
					return [0,0,0,4,9,0,8,7,0,0,0,0,0,1,3,0,4,0,4,5,0,8,0,0,0,0,0,6,4,0,9,0,0,0,1,7,0,0,9,0,6,0,5,0,0,2,3,0,0,0,1,0,6,4,0,0,0,0,0,7,0,8,3,0,2,0,6,3,0,0,0,0,0,1,3,0,8,9,0,0,0];
				case "level_235":
					return [5,0,9,0,7,4,0,2,0,0,2,0,0,0,0,0,0,3,0,0,6,8,0,2,0,0,9,0,5,0,3,0,0,0,6,4,1,0,3,0,2,0,5,0,7,2,6,0,0,0,9,0,8,0,3,0,0,6,0,7,8,0,0,6,0,0,0,0,0,0,3,0,0,4,0,2,1,0,9,0,6];
				case "level_236":
					return [9,6,4,0,7,3,0,1,0,0,0,3,0,0,6,7,0,0,1,7,5,0,0,0,3,0,0,0,1,0,4,3,0,0,0,0,0,0,0,9,0,8,0,0,0,0,0,0,0,2,5,0,3,0,0,0,7,0,0,0,9,6,2,0,0,9,7,0,0,8,0,0,0,2,0,6,9,0,5,7,3];
				case "level_237":
					return [0,0,0,0,0,0,0,1,0,5,1,0,0,4,3,7,0,0,0,2,0,9,1,7,6,0,0,0,0,4,0,0,5,8,0,6,0,8,5,3,0,1,4,9,0,6,0,2,7,0,0,1,0,0,0,0,1,8,5,2,0,4,0,0,0,9,4,7,0,0,3,1,0,4,0,0,0,0,0,0,0];
				case "level_238":
					return [0,6,4,8,0,3,0,7,0,0,0,7,0,0,0,0,0,0,1,0,2,6,0,7,0,3,0,0,0,9,2,0,0,7,0,1,2,7,0,5,0,4,0,8,6,6,0,5,0,0,1,3,0,0,0,2,0,3,0,6,5,0,9,0,0,0,0,0,0,2,0,0,0,9,0,1,0,2,8,6,0];
				case "level_239":
					return [0,2,6,0,3,0,0,0,0,1,0,0,6,0,8,0,4,0,0,8,0,0,7,9,2,0,1,0,0,7,2,0,0,4,9,0,0,5,0,0,4,0,0,7,0,0,4,8,0,0,1,6,0,0,8,0,1,4,5,0,0,3,0,0,9,0,8,0,3,0,0,4,0,0,0,0,1,0,8,2,0];
				case "level_240":
					return [5,0,0,2,0,3,1,0,0,0,2,8,0,4,0,0,0,0,0,0,3,0,6,7,0,8,5,0,6,0,8,0,0,7,1,0,0,0,9,0,1,0,6,0,0,0,3,1,0,0,5,0,2,0,3,5,0,1,9,0,4,0,0,0,0,0,0,5,0,8,3,0,0,0,7,3,0,4,0,0,1];
				case "level_241":
					return [6,3,0,0,0,0,0,0,0,0,5,0,6,1,0,0,4,8,0,0,7,4,0,0,0,5,3,0,9,1,0,6,7,0,0,0,4,0,0,2,9,1,0,0,5,0,0,0,8,4,0,1,6,0,2,7,0,0,0,4,9,0,0,3,4,0,0,8,6,0,2,0,0,0,0,0,0,0,0,3,4];
				case "level_242":
					return [0,2,9,0,8,0,0,6,0,0,0,0,2,0,9,1,8,4,0,0,0,3,6,0,5,0,0,0,9,2,0,7,3,6,4,0,0,0,0,0,0,0,0,0,0,0,8,6,4,1,0,9,3,0,0,0,3,0,4,6,0,0,0,2,7,4,5,0,1,0,0,0,0,6,0,0,2,0,4,5,0];
				case "level_243":
					return [1,0,0,8,6,0,0,4,0,8,0,0,0,0,3,0,6,5,4,0,3,0,0,0,8,0,7,9,0,0,0,0,5,0,7,0,0,7,6,4,0,1,5,8,0,0,1,0,6,0,0,0,0,2,7,0,4,0,0,0,1,0,6,6,3,0,2,0,0,0,0,8,0,8,0,0,3,6,0,0,4];
				case "level_244":
					return [0,5,0,1,2,4,6,8,7,8,0,2,3,0,0,0,0,4,0,0,0,0,6,0,2,0,0,6,0,0,0,3,0,0,0,0,0,9,1,8,0,2,3,7,0,0,0,0,0,1,0,0,0,8,0,0,5,0,9,0,0,0,0,1,0,0,0,0,3,7,0,5,9,8,7,2,5,6,0,1,0];
				case "level_245":
					return [9,0,0,0,0,0,0,3,6,0,6,0,2,5,0,1,0,0,3,0,0,0,1,0,7,8,0,0,0,0,0,8,7,0,2,3,1,0,3,0,2,0,6,0,7,5,7,0,9,3,0,0,0,0,0,9,7,0,4,0,0,0,1,0,0,1,0,6,8,0,7,0,4,3,0,0,0,0,0,0,2];
				case "level_246":
					return [0,0,8,4,0,0,0,0,2,0,0,0,0,6,9,0,0,0,5,0,2,0,7,0,3,4,0,3,0,0,0,4,0,2,6,0,1,4,6,0,5,0,8,7,9,0,8,7,0,9,0,0,0,5,0,3,4,0,2,0,1,0,8,0,0,0,6,1,0,0,0,0,9,0,0,0,0,4,6,0,0];
				case "level_247":
					return [8,0,0,0,0,7,2,0,0,0,5,0,1,8,0,0,4,7,0,4,0,5,9,0,3,1,0,4,0,1,6,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,3,5,0,6,0,9,4,0,6,5,0,2,0,6,2,0,0,3,4,0,7,0,0,0,7,9,0,0,0,0,4];
				case "level_248":
					return [0,0,0,0,0,7,0,9,0,4,2,8,0,9,1,5,0,7,7,0,0,0,0,0,6,0,0,8,5,0,7,0,0,4,0,9,1,0,0,4,0,6,0,0,3,3,0,6,0,0,2,0,7,5,0,0,4,0,0,0,0,0,2,6,0,5,1,2,0,3,8,4,0,8,0,3,0,0,0,0,0];
				case "level_249":
					return [1,7,0,0,4,0,5,0,0,5,0,0,0,0,2,0,0,0,0,0,0,5,7,9,0,2,8,0,6,0,0,5,3,0,8,1,8,3,0,0,0,0,0,5,7,7,9,0,8,1,0,0,4,0,4,5,0,6,3,7,0,0,0,0,0,0,2,0,0,0,0,3,0,0,7,0,9,0,0,6,5];
				case "level_250":
					return [0,0,0,8,0,3,0,0,1,0,8,3,2,0,4,0,0,7,0,7,0,0,9,0,0,0,0,0,0,1,0,0,2,0,6,8,0,6,2,0,4,0,1,7,0,7,3,0,6,0,0,4,0,0,0,0,0,0,6,0,0,1,0,9,0,0,3,0,1,5,2,0,3,0,0,4,0,5,0,0,0];
				case "level_251":
					return [0,4,1,0,9,0,0,8,0,0,0,0,1,0,0,0,0,0,0,7,5,0,2,3,0,0,0,9,0,3,0,4,0,0,0,0,0,2,4,0,8,0,6,7,0,0,0,0,0,3,0,8,0,4,0,0,0,3,5,0,9,1,0,0,0,0,0,0,2,0,0,0,0,1,0,0,7,0,2,6,0];
				case "level_252":
					return [0,9,5,1,0,0,0,0,0,1,0,0,0,0,0,9,0,8,0,0,4,0,9,0,5,0,6,0,0,0,6,0,5,0,3,0,0,0,6,0,0,0,8,0,0,0,5,0,9,0,2,0,0,0,5,0,1,0,3,0,4,0,0,9,0,7,0,0,0,0,0,3,0,0,0,0,0,7,6,8,0];
				case "level_253":
					return [0,5,0,0,1,6,0,0,3,0,7,0,5,0,2,0,6,1,0,0,0,0,0,4,9,5,0,0,0,7,0,0,0,6,0,0,4,0,0,2,0,3,0,0,8,0,0,5,0,0,0,2,0,0,0,4,9,8,0,0,0,0,0,7,6,0,3,0,9,0,1,0,5,0,0,1,4,0,0,9,0];
				case "level_254":
					return [0,4,2,6,0,0,0,0,0,5,0,0,8,1,0,0,4,0,1,8,0,7,0,4,0,9,0,0,0,8,0,0,0,9,0,0,3,0,0,5,0,7,0,0,6,0,0,7,0,0,0,4,0,0,0,1,0,2,0,5,0,8,9,0,2,0,0,6,1,0,0,4,0,0,0,0,0,3,2,6,0];
				case "level_255":
					return [9,0,0,5,1,0,0,0,2,0,4,0,0,0,9,0,8,0,0,0,7,0,8,0,0,0,5,8,0,0,4,0,0,5,2,0,0,0,5,9,0,1,6,0,0,0,6,3,0,0,7,0,0,4,3,0,0,0,4,0,2,0,0,0,2,0,3,0,0,0,4,0,7,0,0,0,9,2,0,0,6];
				case "level_256":
					return [0,1,0,9,0,3,0,7,0,9,0,0,0,0,0,0,0,0,8,5,3,0,2,0,0,0,1,0,3,0,0,4,0,7,0,0,6,9,0,7,0,8,0,3,4,0,0,1,0,9,0,0,5,0,3,0,0,0,6,0,5,1,7,0,0,0,0,0,0,0,0,6,0,6,0,5,0,2,0,9,0];
				case "level_257":
					return [2,0,0,0,0,9,7,0,0,5,3,1,6,0,4,0,0,9,7,8,0,0,3,0,6,0,0,0,0,0,0,0,0,3,0,4,0,0,0,1,0,2,0,0,0,6,0,5,0,0,0,0,0,0,0,0,2,0,6,0,0,9,7,9,0,0,7,0,8,4,1,6,0,0,6,9,0,0,0,0,8];
				case "level_258":
					return [0,0,1,0,6,0,3,0,0,2,0,0,0,0,0,0,6,0,0,3,0,2,0,0,9,4,7,1,0,8,0,7,0,0,0,9,0,0,0,9,0,6,0,0,0,3,0,0,0,5,0,4,0,6,5,2,6,0,0,1,0,3,0,0,1,0,0,0,0,0,0,2,0,0,4,0,2,0,7,0,0];
				case "level_259":
					return [0,0,0,0,1,0,0,6,8,2,0,0,0,0,3,0,9,0,7,0,3,8,0,4,1,0,0,3,0,7,2,0,0,0,0,0,8,0,0,0,0,0,0,0,4,0,0,0,0,0,8,9,0,6,0,0,9,5,0,6,2,0,1,0,7,0,3,0,0,0,0,9,6,8,0,0,2,0,0,0,0];
				case "level_260":
					return [0,0,0,1,5,0,0,0,2,5,0,0,0,0,0,0,0,8,0,7,0,0,0,0,0,4,0,3,0,0,6,4,0,0,2,0,9,5,0,7,8,2,0,3,1,0,4,0,0,1,9,0,0,7,0,3,0,0,0,0,0,9,0,7,0,0,0,0,0,0,0,5,6,0,0,0,9,7,0,0,0];
				case "level_261":
					return [0,8,0,0,3,0,0,6,9,0,0,0,0,0,1,0,3,0,3,2,6,0,9,0,0,0,0,0,0,0,0,0,8,9,0,7,0,0,8,9,0,2,3,0,0,6,0,9,3,0,0,0,0,0,0,0,0,0,2,0,7,5,3,0,4,0,7,0,0,0,0,0,2,9,0,0,5,0,0,8,0];
				case "level_262":
					return [0,0,0,0,9,0,1,6,0,5,4,1,6,0,0,9,0,0,0,0,2,4,0,0,0,0,0,0,0,0,0,5,6,7,8,0,2,0,0,0,4,0,0,0,3,0,3,6,7,2,0,0,0,0,0,0,0,0,0,4,5,0,0,0,0,3,0,0,7,8,4,9,0,6,4,0,1,0,0,0,0];
				case "level_263":
					return [0,8,0,0,1,2,0,5,0,0,9,0,0,3,0,2,0,0,2,0,0,9,0,0,0,0,3,5,0,9,0,0,8,0,3,0,0,0,6,1,0,7,5,0,0,0,4,0,3,0,0,6,0,2,3,0,0,0,0,1,0,0,4,0,0,8,0,4,0,0,6,0,0,1,0,6,7,0,0,2,0];
				case "level_264":
					return [0,8,0,0,2,0,0,0,0,0,4,0,0,0,3,6,0,0,5,3,0,0,0,7,1,8,0,4,7,0,0,0,6,0,0,0,0,0,1,9,4,5,8,0,0,0,0,0,7,0,0,0,6,4,0,2,4,6,0,0,0,1,9,0,0,6,2,0,0,0,4,0,0,0,0,0,9,0,0,5,0];
				case "level_265":
					return [8,0,9,0,0,0,0,0,7,2,0,0,7,0,9,8,0,0,3,1,0,0,0,4,0,9,0,0,0,0,0,5,0,0,0,8,0,8,0,2,0,6,0,3,0,9,0,0,0,3,0,0,0,0,0,6,0,1,0,0,0,7,5,0,0,8,3,0,5,0,0,6,7,0,0,0,0,0,3,0,1];
				case "level_266":
					return [0,5,4,3,0,0,0,2,0,0,1,0,0,8,5,7,0,0,0,0,0,0,4,0,0,9,0,0,2,0,0,0,9,0,0,6,0,0,3,0,0,0,2,0,0,8,0,0,2,0,0,0,5,0,0,7,0,0,2,0,0,0,0,0,0,5,9,6,0,0,3,0,0,6,0,0,0,8,5,7,0];
				case "level_267":
					return [0,0,1,0,5,0,0,4,0,0,0,9,0,6,1,8,0,0,5,0,0,8,0,0,0,0,7,9,1,0,0,0,7,5,0,0,0,3,0,6,0,8,0,1,0,0,0,7,4,0,0,0,2,3,7,0,0,0,0,2,0,0,9,0,0,3,9,8,0,4,0,0,0,9,0,0,7,0,2,0,0];
				case "level_268":
					return [0,0,7,0,0,0,0,6,8,0,0,5,6,0,0,0,0,0,8,0,6,0,4,7,9,0,0,0,7,0,0,9,2,0,4,0,0,0,0,0,0,0,0,0,0,0,4,0,7,5,0,0,2,0,0,0,4,1,3,0,5,0,9,0,0,0,0,0,9,4,0,0,3,5,0,0,0,0,7,0,0];
				case "level_269":
					return [0,3,8,0,7,2,0,0,0,0,0,0,0,0,6,5,0,8,4,0,2,0,0,1,0,0,0,3,1,0,0,0,0,0,0,0,2,7,0,0,0,0,0,3,5,0,0,0,0,0,0,0,9,2,0,0,0,9,0,0,3,0,1,5,0,1,6,0,0,0,0,0,0,0,0,2,1,0,7,5,0];
				case "level_270":
					return [0,0,0,7,5,0,4,3,0,4,0,9,6,0,0,0,0,0,0,0,0,8,0,0,7,0,2,0,0,0,0,0,0,0,8,3,9,3,0,0,0,0,0,5,7,7,1,0,0,0,0,0,0,0,8,0,3,0,0,1,0,0,0,0,0,0,0,0,6,8,0,9,0,9,5,0,8,7,0,0,0];
				case "level_271":
					return [2,0,4,3,0,0,0,6,0,0,5,0,6,0,0,1,2,4,0,0,0,0,0,0,0,9,5,0,6,5,0,7,0,0,1,0,3,0,0,0,0,0,0,0,2,0,2,0,0,9,0,5,4,0,1,3,0,0,0,0,0,0,0,4,8,7,0,0,2,0,5,0,0,9,0,0,0,8,2,0,7];
				case "level_272":
					return [0,2,0,0,0,3,7,0,0,8,5,0,0,0,7,2,3,0,0,6,0,0,8,0,0,0,0,2,7,0,0,0,9,0,0,0,0,0,4,6,2,8,5,0,0,0,0,0,7,0,0,0,9,2,0,0,0,0,3,0,0,4,0,0,4,5,9,0,0,0,1,6,0,0,7,1,0,0,0,2,0];
				case "level_273":
					return [9,0,0,5,0,3,7,0,8,5,0,0,0,4,9,6,0,0,0,0,0,0,0,1,0,5,4,0,2,0,0,0,0,0,6,0,0,0,1,3,0,2,4,0,0,0,8,0,0,0,0,0,7,0,6,5,0,4,0,0,0,0,0,0,0,3,8,9,0,0,0,6,8,0,9,2,0,6,0,0,7];
				case "level_274":
					return [0,0,0,0,9,0,3,5,0,0,1,0,5,0,0,0,0,0,8,7,5,4,0,0,0,6,0,0,0,0,0,2,4,6,3,0,6,0,0,0,5,0,0,0,2,0,4,7,3,1,0,0,0,0,0,8,0,0,0,3,5,9,1,0,0,0,0,0,5,0,2,0,0,9,3,0,8,0,0,0,0];
				case "level_275":
					return [0,5,0,0,0,2,7,0,0,0,0,0,0,0,0,0,6,2,9,8,2,0,0,0,0,4,0,0,0,0,2,0,3,0,0,6,3,6,0,1,0,4,0,7,8,4,0,0,6,0,8,0,0,0,0,4,0,0,0,0,9,2,1,8,1,0,0,0,0,0,0,0,0,0,3,7,0,0,0,5,0];
				case "level_276":
					return [0,0,3,0,0,0,6,0,2,7,0,0,0,3,0,8,0,1,9,5,0,2,0,0,0,0,0,0,0,0,4,0,6,0,8,0,5,0,0,0,0,0,0,0,9,0,3,0,8,0,9,0,0,0,0,0,0,0,0,1,0,6,8,8,0,9,0,6,0,0,0,7,6,0,5,0,0,0,1,0,0];
				case "level_277":
					return [9,4,0,0,1,8,0,0,0,0,0,0,6,0,0,0,0,0,6,5,0,0,3,0,0,7,0,8,0,3,0,5,0,0,0,0,5,1,0,0,7,0,0,4,2,0,0,0,0,8,0,5,0,7,0,6,0,0,4,0,0,2,1,0,0,0,0,0,1,0,0,0,0,0,0,8,9,0,0,6,3];
				case "level_278":
					return [0,0,2,0,6,0,0,0,0,0,3,0,5,0,0,0,0,0,0,8,6,7,0,4,0,0,5,0,0,0,0,1,0,3,6,0,0,7,0,8,0,5,0,1,0,0,2,4,0,3,0,0,0,0,5,0,0,1,0,3,6,7,0,0,0,0,0,0,8,0,4,0,0,0,0,0,5,0,8,0,0];
				case "level_279":
					return [5,3,0,0,0,6,0,0,0,0,8,4,0,5,9,0,0,0,0,0,0,0,0,7,0,5,4,9,0,6,0,0,0,0,0,0,4,0,3,0,0,0,8,0,9,0,0,0,0,0,0,5,0,3,2,4,0,7,0,0,0,0,0,0,0,0,9,8,0,3,2,0,0,0,0,5,0,0,0,9,1];
				case "level_280":
					return [7,5,0,6,0,0,0,0,0,0,0,2,0,0,0,4,6,0,0,3,0,0,2,0,1,8,0,0,0,0,9,0,4,0,0,1,0,7,0,0,0,0,0,5,0,2,0,0,1,0,5,0,0,0,0,1,5,0,4,0,0,3,0,0,4,7,0,0,0,8,0,0,0,0,0,0,0,8,0,1,4];
				case "level_281":
					return [0,1,0,3,0,0,0,0,0,0,0,0,5,0,4,0,0,2,0,6,0,0,7,0,0,1,0,0,4,6,0,0,0,1,0,8,0,2,9,0,8,0,5,6,0,8,0,5,0,0,0,9,2,0,0,3,0,0,6,0,0,5,0,4,0,0,1,0,9,0,0,0,0,0,0,0,0,2,0,3,0];
				case "level_282":
					return [0,1,0,5,0,4,7,0,0,0,0,7,8,0,0,0,5,0,0,5,0,3,0,2,4,0,8,0,0,4,0,6,5,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,7,4,0,9,0,0,5,0,1,6,0,7,0,2,0,0,8,0,0,0,1,5,0,0,0,0,2,4,0,3,0,9,0];
				case "level_283":
					return [0,0,0,0,4,5,0,1,6,0,5,0,0,3,0,0,4,9,0,0,0,0,0,2,0,0,0,8,0,0,0,0,0,1,0,0,1,6,0,2,5,8,0,3,7,0,0,9,0,0,0,0,0,8,0,0,0,6,0,0,0,0,0,3,2,0,0,1,0,0,9,0,7,9,0,8,2,0,0,0,0];
				case "level_284":
					return [0,0,4,0,0,0,0,8,0,0,0,2,0,1,7,0,0,3,0,9,3,0,8,0,6,0,7,0,0,0,1,6,5,0,3,0,0,0,0,0,0,0,0,0,0,0,8,0,7,2,3,0,0,0,2,0,6,0,7,0,1,9,0,1,0,0,6,5,0,4,0,0,0,5,0,0,0,0,3,0,0];
				case "level_285":
					return [0,0,0,0,0,2,0,0,6,6,0,0,4,7,0,2,0,1,0,1,7,0,0,0,0,0,8,0,6,0,8,1,0,0,3,0,0,0,0,0,0,0,0,0,0,0,8,0,0,2,3,0,6,0,8,0,0,0,0,0,5,9,0,9,0,5,0,6,8,0,0,2,1,0,0,9,0,0,0,0,0];
				case "level_286":
					return [7,9,0,0,1,3,0,8,0,0,0,2,0,4,7,1,0,0,0,0,0,0,0,6,0,2,0,0,0,0,0,0,0,7,6,0,0,0,7,1,6,9,8,0,0,0,1,6,0,0,0,0,0,0,0,7,0,5,0,0,0,0,0,0,0,1,6,8,0,2,0,0,0,4,0,3,7,0,0,1,5];
				case "level_287":
					return [1,0,0,0,4,0,0,0,0,5,0,2,0,0,8,0,6,1,7,0,0,0,0,5,0,9,0,8,0,7,0,0,9,0,0,0,0,6,0,3,7,2,0,1,0,0,0,0,8,0,0,7,0,9,0,9,0,4,0,0,0,0,7,4,7,0,9,0,0,3,0,6,0,0,0,0,3,0,0,0,2];
				case "level_288":
					return [0,0,0,0,0,5,0,3,2,0,7,0,3,0,9,8,4,0,0,3,0,0,8,4,1,0,0,7,0,0,0,0,0,0,0,4,0,0,5,9,0,1,6,0,0,3,0,0,0,0,0,0,0,9,0,0,3,8,5,0,0,2,0,0,4,7,1,0,2,0,8,0,2,5,0,6,0,0,0,0,0];
				case "level_289":
					return [0,0,7,6,2,0,4,0,0,5,0,0,9,0,0,0,0,0,1,0,0,3,5,0,0,9,7,7,0,6,0,0,0,0,0,0,0,0,5,7,6,8,2,0,0,0,0,0,0,0,0,5,0,6,8,5,0,0,7,3,0,0,2,0,0,0,0,0,6,0,0,4,0,0,4,0,1,5,7,0,0];
				case "level_290":
					return [5,7,0,2,4,0,0,0,0,4,9,0,0,6,0,0,0,2,0,0,0,8,0,0,0,0,0,0,0,5,0,0,0,0,3,0,6,1,0,3,2,8,0,5,7,0,3,0,0,0,0,9,0,0,0,0,0,0,0,7,0,0,0,9,0,0,0,5,0,0,6,8,0,0,0,0,8,3,0,1,9];
				case "level_291":
					return [0,0,8,0,3,0,1,0,5,9,0,0,7,0,0,0,8,0,5,0,0,8,2,0,4,0,0,0,0,6,0,0,5,7,2,1,0,0,0,0,0,0,0,0,0,3,9,2,1,0,0,5,0,0,0,0,5,0,8,6,0,0,3,0,3,0,0,0,7,0,0,6,6,0,4,0,1,0,8,0,0];
				case "level_292":
					return [0,0,0,0,2,7,9,0,0,1,0,2,5,0,0,0,0,6,0,5,0,9,0,0,0,0,8,7,0,0,0,0,5,0,3,0,6,1,0,0,0,0,0,4,7,0,8,0,7,0,0,0,0,2,4,0,0,0,0,9,0,6,0,2,0,0,0,0,4,3,0,9,0,0,1,6,5,0,0,0,0];
				case "level_293":
					return [0,0,0,0,0,4,0,0,3,0,0,0,9,6,8,0,0,0,0,6,1,3,7,0,0,8,0,9,0,3,0,0,0,0,0,2,0,7,0,0,4,0,0,5,0,8,0,0,0,0,0,1,0,6,0,1,0,0,3,2,8,7,0,0,0,0,6,9,7,0,0,0,2,0,0,4,0,0,0,0,0];
				case "level_294":
					return [0,0,0,8,0,0,0,0,7,0,2,6,0,7,0,5,0,9,0,7,9,0,0,0,0,8,0,0,0,0,6,0,1,0,0,3,0,0,2,0,0,0,8,0,0,4,0,0,9,0,2,0,0,0,0,4,0,0,0,0,6,2,0,6,0,5,0,9,0,4,3,0,2,0,0,0,0,6,0,0,0];
				case "level_295":
					return [3,0,0,0,0,0,1,0,0,0,7,0,5,8,0,4,0,0,0,5,9,0,3,0,7,0,2,7,0,0,6,9,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,4,5,0,0,3,2,0,8,0,5,0,9,4,0,0,0,1,0,6,9,0,8,0,0,0,7,0,0,0,0,0,6];
				case "level_296":
					return [0,0,1,0,0,0,6,0,0,5,0,0,0,6,7,0,0,0,3,0,0,0,0,0,0,0,8,0,0,4,0,9,6,0,0,3,6,0,8,3,7,2,1,0,9,1,0,0,5,4,0,2,0,0,8,0,0,0,0,0,0,0,7,0,0,0,9,8,0,0,0,2,0,0,3,0,0,0,4,0,0];
				case "level_297":
					return [0,4,6,0,0,0,0,3,2,0,2,0,9,0,0,0,0,7,0,0,0,4,3,0,0,0,9,0,0,5,7,4,0,0,0,0,2,8,0,0,0,0,0,7,4,0,0,0,0,2,3,1,0,0,5,0,0,0,7,4,0,0,0,7,0,0,0,0,5,0,4,0,8,3,0,0,0,0,7,9,0];
				case "level_298":
					return [0,0,0,0,0,9,1,0,7,1,8,0,0,2,3,0,0,0,3,0,6,0,0,4,0,0,0,0,4,8,0,0,0,0,0,0,0,2,3,0,0,0,7,8,0,0,0,0,0,0,0,3,5,0,0,0,0,5,0,0,4,0,8,0,0,0,3,4,0,0,7,2,4,0,7,9,0,0,0,0,0];
				case "level_299":
					return [0,0,0,0,0,0,0,3,6,5,6,9,0,0,0,0,0,7,2,0,0,0,0,4,1,0,0,0,0,0,3,0,8,0,7,0,4,3,0,7,0,6,0,1,8,0,8,0,1,0,5,0,0,0,0,0,4,5,0,0,0,0,2,7,0,0,0,0,0,5,9,3,8,5,0,0,0,0,0,0,0];
				case "level_300":
					return [0,9,0,4,0,0,0,3,0,7,0,3,0,1,2,0,0,0,1,0,0,9,0,0,0,8,0,5,0,8,0,0,0,0,0,0,0,7,6,0,0,0,8,2,0,0,0,0,0,0,0,4,0,5,0,3,0,0,0,5,0,0,2,0,0,0,1,6,0,3,0,8,0,5,0,0,0,8,0,7,0];
				case "level_301":
					return [7,4,0,0,0,9,0,5,0,0,0,8,4,0,0,9,0,0,0,0,0,7,5,0,0,0,4,0,0,2,0,1,6,0,4,0,8,1,0,0,0,0,0,2,9,0,7,0,9,2,0,3,0,0,6,0,0,0,7,3,0,0,0,0,0,9,0,0,5,4,0,0,0,2,0,8,0,0,0,6,3];
				case "level_302":
					return [0,3,0,0,8,5,0,9,1,0,0,8,3,0,0,0,0,0,9,1,0,7,0,0,0,0,0,0,0,1,0,2,0,0,3,0,0,0,4,0,7,0,8,0,0,0,7,0,0,5,0,4,0,0,0,0,0,0,0,7,0,5,6,0,0,0,0,0,1,9,0,0,6,8,0,5,3,0,0,2,0];
				case "level_303":
					return [7,0,3,0,4,0,9,1,0,0,0,2,0,6,9,0,3,0,0,0,8,0,0,0,0,0,6,0,0,0,8,1,4,0,0,5,0,0,0,0,0,0,0,0,0,8,0,0,6,9,3,0,0,0,5,0,0,0,0,0,2,0,0,0,8,0,4,3,0,1,0,0,0,4,9,0,5,0,8,0,7];
				case "level_304":
					return [0,5,8,0,1,0,7,0,0,0,0,0,5,0,0,0,0,0,0,2,7,0,4,3,0,0,0,9,6,0,0,3,0,0,0,0,0,8,1,0,6,0,5,9,0,0,0,0,0,9,0,0,3,2,0,0,0,3,5,0,1,4,0,0,0,0,0,0,7,0,0,0,0,0,6,0,2,0,9,7,0];
				case "level_305":
					return [4,3,0,8,5,0,0,0,2,0,0,0,4,6,7,0,0,0,0,0,0,0,0,9,8,0,0,0,2,7,0,0,0,3,0,0,1,0,0,0,9,0,0,0,4,0,0,8,0,0,0,6,5,0,0,0,5,9,0,0,0,0,0,0,0,0,3,7,6,0,0,0,3,0,0,0,4,5,0,2,7];
				case "level_306":
					return [0,0,0,0,8,9,4,3,2,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,7,1,0,0,8,0,0,0,4,0,2,9,0,4,9,8,7,2,3,5,0,5,1,0,3,0,0,0,4,0,0,5,7,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,4,9,1,2,3,0,0,0,0];
				case "level_307":
					return [0,0,2,1,0,0,0,5,0,0,0,0,0,9,0,0,6,0,0,6,7,3,0,0,0,1,4,0,0,0,2,0,0,0,3,5,0,0,6,4,5,8,7,0,0,5,2,0,0,0,3,0,0,0,8,7,0,0,0,2,5,9,0,0,4,0,0,8,0,0,0,0,0,5,0,0,0,9,2,0,0];
				case "level_308":
					return [0,5,1,6,0,0,0,0,7,0,0,0,0,0,0,0,8,4,9,0,0,1,0,0,5,2,6,2,0,9,0,7,0,0,0,1,0,1,0,0,0,0,0,4,0,8,0,0,0,5,0,9,0,3,1,2,8,0,0,3,0,0,9,7,9,0,0,0,0,0,0,0,3,0,0,0,0,4,2,1,0];
				case "level_309":
					return [0,2,0,8,6,0,1,0,0,0,8,4,0,7,0,2,0,5,7,0,0,0,0,0,9,0,0,2,0,0,3,4,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1,8,0,0,7,0,0,2,0,0,0,0,0,3,5,0,6,0,8,0,4,1,0,0,0,9,0,3,4,0,6,0];
				case "level_310":
					return [0,0,1,6,3,0,0,0,0,0,0,9,7,0,4,0,6,2,4,3,0,0,0,9,0,0,1,0,0,5,0,0,0,9,0,0,1,0,0,0,0,0,0,0,8,0,0,8,0,0,0,7,0,0,6,0,0,5,0,0,0,8,4,9,5,0,4,0,1,6,0,0,0,0,0,0,6,7,5,0,0];
				case "level_311":
					return [4,0,0,0,8,6,0,0,7,0,0,5,0,0,0,8,0,1,0,0,0,0,0,5,0,4,0,2,1,0,8,0,3,0,0,0,0,0,3,0,7,0,6,0,0,0,0,0,9,0,4,0,3,8,0,8,0,4,0,0,0,0,0,5,0,1,0,0,0,7,0,0,7,0,0,6,9,0,0,0,5];
				case "level_312":
					return [0,0,9,0,3,0,7,0,4,0,0,0,9,7,0,8,0,0,0,0,0,0,0,0,0,1,0,3,0,0,0,6,0,0,0,9,5,7,4,0,9,0,1,2,6,1,0,0,0,2,0,0,0,7,0,6,0,0,0,0,0,0,0,0,0,3,0,1,2,0,0,0,8,0,1,0,5,0,6,0,0];
				case "level_313":
					return [3,0,1,8,0,9,0,6,0,0,0,0,0,6,5,0,1,0,6,0,0,1,0,0,4,0,8,0,4,0,0,0,0,0,5,0,9,0,0,0,0,0,0,0,4,0,1,0,0,0,0,0,3,0,8,0,2,0,0,3,0,0,9,0,9,0,6,2,0,0,0,0,0,3,0,5,0,8,6,0,7];
				case "level_314":
					return [0,4,0,0,1,0,0,0,8,0,9,0,0,3,8,0,7,0,0,0,8,4,0,0,1,0,0,4,0,7,0,0,9,0,1,0,6,0,0,3,0,2,0,0,7,0,5,0,1,0,0,8,0,6,0,0,1,0,0,3,5,0,0,0,3,0,6,2,0,0,8,0,9,0,0,0,5,0,0,6,0];
				case "level_315":
					return [2,0,0,8,0,1,0,5,0,7,0,3,9,0,4,0,2,0,0,6,0,0,0,7,0,0,3,0,0,0,4,8,0,0,0,5,0,0,0,0,1,0,0,0,0,8,0,0,0,9,3,0,0,0,4,0,0,6,0,0,0,3,0,0,3,0,1,0,2,6,0,8,0,7,0,3,0,8,0,0,4];
				case "level_316":
					return [4,0,0,0,0,1,2,0,0,7,5,1,0,0,0,0,0,6,0,0,0,0,0,0,0,1,8,0,0,0,1,0,9,0,8,0,8,9,0,3,0,6,0,7,2,0,6,0,8,0,7,0,0,0,3,7,0,0,0,0,0,0,0,6,0,0,0,0,0,5,3,1,0,0,9,2,0,0,0,0,4];
				case "level_317":
					return [0,0,0,7,0,1,0,8,0,0,0,4,0,0,0,0,2,0,1,5,6,0,0,0,4,0,0,4,0,0,0,0,7,5,0,0,0,0,9,6,0,4,1,0,0,0,0,3,5,0,0,0,0,8,0,0,1,0,0,0,8,5,6,0,9,0,0,0,0,2,0,0,0,6,0,1,0,5,0,0,0];
				case "level_318":
					return [0,6,7,0,0,1,8,0,0,8,0,0,6,5,0,0,0,0,0,3,0,0,0,0,2,0,0,7,1,0,0,0,0,4,0,0,0,0,8,9,1,4,7,0,0,0,0,4,0,0,0,0,1,6,0,0,6,0,0,0,0,2,0,0,0,0,0,8,5,0,0,3,0,0,3,7,0,0,9,4,0];
				case "level_319":
					return [0,0,6,0,7,3,2,0,0,2,0,0,0,0,1,0,6,7,8,0,0,0,0,0,0,0,0,0,0,0,0,9,0,3,1,5,3,0,7,0,1,0,4,0,2,5,8,1,0,2,0,0,0,0,0,0,0,0,0,0,0,0,3,4,3,0,2,0,0,0,0,9,0,0,2,1,3,0,6,0,0];
				case "level_320":
					return [0,4,0,0,9,0,0,7,0,0,0,0,7,0,0,2,0,0,1,0,0,5,0,0,0,4,3,0,0,0,2,0,8,1,0,6,2,0,0,0,3,0,0,0,8,6,0,4,9,0,1,0,0,0,3,7,0,0,0,2,0,0,4,0,0,1,0,0,9,0,0,0,0,2,0,0,6,0,0,3,0];
				case "level_321":
					return [0,0,6,0,0,7,0,3,1,3,2,1,0,0,6,5,0,0,5,0,4,0,0,0,0,0,0,0,0,2,0,8,0,6,5,0,1,0,0,0,0,0,0,0,7,0,5,3,0,4,0,1,0,0,0,0,0,0,0,0,7,0,2,0,0,5,1,0,0,9,8,3,8,1,0,9,0,0,4,0,0];
				case "level_322":
					return [0,0,0,5,4,0,2,0,1,0,0,0,8,0,0,0,4,3,4,2,0,7,0,0,0,0,0,0,0,0,0,0,0,8,5,0,0,5,1,0,0,0,3,2,0,0,3,4,0,0,0,0,0,0,0,0,0,0,0,7,0,6,2,5,9,0,0,0,4,0,0,0,6,0,3,0,1,5,0,0,0];
				case "level_323":
					return [0,7,0,0,1,4,0,0,5,0,0,3,8,7,0,0,0,0,0,2,0,6,0,0,0,7,0,0,0,2,0,0,0,7,0,0,9,0,6,0,0,0,5,0,8,0,0,4,0,0,0,2,0,0,0,3,0,0,0,8,0,4,0,0,0,0,0,2,1,6,0,0,4,0,0,9,3,0,0,2,0];
				case "level_324":
					return [2,0,4,5,0,6,8,0,0,0,6,3,7,0,0,0,0,0,1,0,0,8,3,0,6,0,0,0,1,0,0,0,0,0,9,0,3,0,0,9,0,5,0,0,7,0,2,0,0,0,0,0,4,0,0,0,1,0,8,4,0,0,5,0,0,0,0,0,3,1,6,0,0,0,2,1,0,9,4,0,8];
				case "level_325":
					return [8,0,6,0,0,0,0,7,0,0,9,0,4,8,0,0,6,3,0,0,0,0,0,3,0,9,0,0,0,9,7,6,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,3,1,9,0,0,0,6,0,2,0,0,0,0,0,5,2,0,0,9,7,0,3,0,0,7,0,0,0,0,2,0,5];
				case "level_326":
					return [0,4,0,6,9,0,0,0,0,0,6,7,0,4,5,0,0,0,0,9,0,0,0,8,6,1,0,0,0,8,0,0,0,0,3,0,0,0,3,0,8,0,9,0,0,0,7,0,0,0,0,8,0,0,0,2,9,5,0,0,0,8,0,0,0,0,9,3,0,1,6,0,0,0,0,0,7,6,0,9,0];
				case "level_327":
					return [0,2,0,0,0,0,4,0,0,0,4,0,7,5,0,0,9,8,9,0,0,0,6,2,0,0,0,4,6,0,0,0,1,5,0,0,0,0,1,0,0,0,7,0,0,0,0,9,5,0,0,0,1,4,0,0,0,8,3,0,0,0,1,6,7,0,0,9,5,0,3,0,0,0,3,0,0,0,0,7,0];
				case "level_328":
					return [9,0,2,0,0,5,8,0,0,8,0,0,9,0,6,0,4,0,5,6,0,0,0,0,0,0,2,0,0,0,0,6,0,0,0,7,0,0,6,8,0,1,4,0,0,4,0,0,0,9,0,0,0,0,2,0,0,0,0,0,0,7,4,0,4,0,7,0,2,0,0,1,0,0,7,3,0,0,5,0,6];
				case "level_329":
					return [0,2,0,3,8,0,0,0,0,0,9,0,0,0,5,2,1,0,0,3,4,0,7,2,0,0,0,0,0,9,0,0,0,0,8,0,0,0,2,0,9,0,7,0,0,0,7,0,0,0,0,9,0,0,0,0,0,5,6,0,8,3,0,0,4,3,9,0,0,0,2,0,0,0,0,0,2,3,0,6,0];
				case "level_330":
					return [0,0,0,9,1,0,5,4,0,0,0,0,6,0,0,0,9,3,4,7,0,8,0,0,0,0,0,0,0,0,0,0,0,6,0,5,7,0,5,0,0,0,1,0,9,9,0,2,0,0,0,0,0,0,0,0,0,0,0,8,0,6,7,6,5,0,0,0,2,0,0,0,0,1,7,0,6,9,0,0,0];
				case "level_331":
					return [0,0,7,4,0,0,0,0,6,4,0,0,3,0,6,5,2,7,0,0,9,0,7,0,0,4,3,7,0,8,0,0,0,0,0,0,0,0,0,2,0,9,0,0,0,0,0,0,0,0,0,1,0,5,3,6,0,0,1,0,7,0,0,8,1,2,7,0,5,0,0,4,9,0,0,0,0,4,3,0,0];
				case "level_332":
					return [0,0,1,0,0,0,0,0,8,5,7,2,0,0,8,4,0,0,0,4,0,0,1,0,0,9,0,7,0,0,0,5,0,0,6,9,0,0,0,1,0,7,0,0,0,1,2,0,0,3,0,0,0,4,0,5,0,0,8,0,0,2,0,0,0,4,9,0,0,8,1,3,8,0,0,0,0,0,9,0,0];
				case "level_333":
					return [0,0,0,0,0,8,3,0,9,4,0,0,9,0,7,0,2,1,9,0,0,0,2,1,0,5,0,0,0,4,0,0,0,1,0,0,0,8,0,7,0,5,0,6,0,0,0,9,0,0,0,7,0,0,0,9,0,2,8,0,0,0,3,1,4,0,5,0,3,0,0,2,8,0,3,6,0,0,0,0,0];
				case "level_334":
					return [0,0,0,4,0,8,0,1,0,0,0,0,0,2,0,5,0,9,1,0,5,0,0,0,8,7,0,0,0,1,0,9,0,4,6,8,6,0,0,0,0,0,0,0,5,5,2,9,0,4,0,7,0,0,0,6,8,0,0,0,3,0,7,7,0,3,0,6,0,0,0,0,0,1,0,7,0,3,0,0,0];
				case "level_335":
					return [0,4,3,0,8,0,0,7,1,0,6,0,0,5,1,0,0,4,0,9,0,0,0,0,8,0,0,0,0,0,5,7,2,4,0,0,0,0,0,0,0,0,0,0,0,0,0,8,1,6,4,0,0,0,0,0,2,0,0,0,0,4,0,5,0,0,7,2,0,0,9,0,6,7,0,0,1,0,3,5,0];
				case "level_336":
					return [0,0,0,0,0,0,5,9,0,3,0,0,9,0,0,0,0,2,2,9,0,5,7,0,6,0,0,5,0,0,6,0,0,0,1,7,0,0,3,0,0,0,2,0,0,4,1,0,0,0,3,0,0,6,0,0,5,0,6,1,0,3,8,9,0,0,0,0,8,0,0,1,0,8,6,0,0,0,0,0,0];
				case "level_337":
					return [5,0,1,0,0,0,0,0,8,3,6,0,0,0,7,0,1,0,4,0,0,8,0,1,5,0,0,0,0,0,0,9,0,0,0,5,0,5,0,4,0,2,0,3,0,1,0,0,0,3,0,0,0,0,0,0,5,3,0,9,0,0,2,0,2,0,6,0,0,0,8,9,8,0,0,0,0,0,3,0,6];
				case "level_338":
					return [8,0,0,0,7,0,9,0,5,0,0,0,0,6,0,0,7,0,0,0,0,5,8,4,0,0,3,0,0,6,0,0,0,0,0,0,1,0,7,6,4,8,5,0,2,0,0,0,0,0,0,4,0,0,9,0,0,7,1,2,0,0,0,0,8,0,0,5,0,0,0,0,7,0,2,0,3,0,0,0,4];
				case "level_339":
					return [0,0,0,0,0,1,0,8,0,0,0,0,0,9,0,0,0,1,0,0,9,7,0,2,0,4,6,8,5,0,0,2,0,0,0,0,0,4,0,1,0,9,0,7,0,0,0,0,0,7,0,0,6,2,6,1,0,4,0,8,9,0,0,5,0,0,0,6,0,0,0,0,0,2,0,9,0,0,0,0,0];
				case "level_340":
					return [0,0,0,8,0,0,0,0,0,0,7,0,0,1,0,9,0,0,4,0,1,0,0,9,7,5,0,0,9,0,4,0,0,3,0,0,6,3,0,0,0,0,0,8,1,0,0,5,0,0,1,0,4,0,0,2,9,1,0,0,8,0,7,0,0,6,0,5,0,0,9,0,0,0,0,0,0,3,0,0,0];
				case "level_341":
					return [4,9,0,0,0,0,7,8,0,7,0,0,9,0,3,0,0,0,0,8,5,0,1,0,0,0,0,2,3,9,0,5,0,0,7,0,0,0,8,0,0,0,2,0,0,0,4,0,0,3,0,8,5,1,0,0,0,0,2,0,4,6,0,0,0,0,6,0,4,0,0,7,0,6,4,0,0,0,0,9,2];
				case "level_342":
					return [0,0,0,0,0,4,0,3,0,4,0,0,0,0,0,1,0,8,0,0,3,0,8,5,9,0,0,0,1,2,8,0,7,0,0,0,7,0,0,0,9,0,0,0,5,0,0,0,6,0,3,8,7,0,0,0,9,5,6,0,4,0,0,1,0,4,0,0,0,0,0,9,0,8,0,3,0,0,0,0,0];
				case "level_343":
					return [3,0,4,0,0,0,7,9,0,0,0,9,6,0,0,0,5,0,0,0,0,4,7,0,0,6,0,1,0,0,5,4,0,0,0,0,0,9,8,0,0,0,5,4,0,0,0,0,0,9,7,0,0,2,0,1,0,0,5,4,0,0,0,0,5,0,0,0,1,4,0,0,0,8,7,0,0,0,6,0,5];
				case "level_344":
					return [0,0,0,0,1,0,0,0,8,8,6,0,5,0,0,4,0,3,0,2,0,3,0,0,0,0,7,0,0,0,2,0,0,7,0,5,0,8,0,4,7,9,0,6,0,2,0,7,0,0,5,0,0,0,7,0,0,0,0,1,0,2,0,6,0,9,0,0,2,0,7,1,4,0,0,0,9,0,0,0,0];
				case "level_345":
					return [0,8,0,0,3,0,0,5,0,0,5,0,2,0,0,0,0,0,0,0,0,6,0,7,4,0,0,8,7,0,0,0,0,1,0,5,9,4,0,0,1,0,0,8,6,6,0,1,0,0,0,0,4,9,0,0,7,5,0,9,0,0,0,0,0,0,0,0,4,0,2,0,0,2,0,0,8,0,0,6,0];
				case "level_346":
					return [0,0,0,0,0,8,0,2,0,0,0,0,7,5,4,0,0,0,9,0,5,2,1,0,4,0,0,2,7,0,0,0,0,0,6,0,0,0,1,0,8,0,3,0,0,0,4,0,0,0,0,0,5,9,0,0,9,0,2,6,1,0,4,0,0,0,5,7,1,0,0,0,0,6,0,8,0,0,0,0,0];
				case "level_347":
					return [0,0,6,0,7,0,5,0,0,7,3,8,0,0,4,0,0,9,4,0,0,0,0,0,0,7,0,0,9,0,0,3,0,6,8,0,0,0,0,2,0,8,0,0,0,0,4,1,0,5,0,0,2,0,0,7,0,0,0,0,0,0,8,9,0,0,7,0,0,2,5,6,0,0,4,0,8,0,9,0,0];
				case "level_348":
					return [7,0,0,0,0,2,9,5,0,2,9,1,0,0,5,0,0,4,3,0,6,0,0,0,0,0,0,5,0,0,0,7,0,0,4,1,0,0,3,0,0,0,5,0,0,8,4,0,0,9,0,0,0,6,0,0,0,0,0,0,4,0,7,4,0,0,8,0,0,1,6,5,0,1,5,3,0,0,0,0,8];
				case "level_349":
					return [0,0,2,6,1,0,0,0,0,5,0,1,9,0,0,0,0,0,0,4,0,0,5,0,0,2,1,9,1,0,0,0,0,5,0,0,0,0,7,0,0,0,8,0,0,0,0,8,0,0,0,0,6,3,2,9,0,0,4,0,0,3,0,0,0,0,0,0,9,4,0,8,0,0,0,0,7,1,2,0,0];
				case "level_350":
					return [7,0,0,8,0,5,6,4,0,0,5,1,0,0,7,0,2,0,2,0,0,6,1,0,0,0,0,9,0,0,0,0,0,0,0,7,0,2,0,0,0,0,0,3,0,3,0,0,0,0,0,0,0,8,0,0,0,0,6,8,0,0,9,0,6,0,9,0,0,3,5,0,0,7,9,5,0,2,0,0,6];
				case "level_351":
					return [0,0,0,0,1,0,9,4,3,7,0,0,4,0,0,0,0,0,5,0,1,0,3,0,0,0,6,0,5,8,9,0,0,0,0,0,0,6,0,5,0,1,0,9,0,0,0,0,0,0,6,4,5,0,6,0,0,0,9,0,5,0,8,0,0,0,0,0,2,0,0,9,1,8,9,0,5,0,0,0,0];
				case "level_352":
					return [0,9,0,0,0,5,0,0,3,0,0,8,0,2,9,0,0,1,1,0,6,0,4,0,9,0,0,6,2,5,1,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,6,2,3,4,0,0,9,0,6,0,8,0,7,4,0,0,7,9,0,1,0,0,7,0,0,5,0,0,0,4,0];
				case "level_353":
					return [6,7,0,0,3,1,0,0,8,0,0,0,2,8,0,0,5,0,0,0,8,0,0,0,0,0,6,0,0,3,1,0,0,0,4,5,0,0,5,0,0,0,6,0,0,7,4,0,0,0,5,1,0,0,9,0,0,0,0,0,4,0,0,0,3,0,0,7,9,0,0,0,4,0,0,6,1,0,0,2,3];
				case "level_354":
					return [0,0,2,1,0,8,5,0,0,8,4,6,0,5,0,0,9,0,0,5,0,0,0,0,0,0,0,0,0,8,0,2,0,0,0,6,0,7,9,3,0,4,2,5,0,4,0,0,0,7,0,9,0,0,0,0,0,0,0,0,0,2,0,0,6,0,0,1,0,8,3,9,0,0,4,9,0,2,6,0,0];
				case "level_355":
					return [0,0,8,9,0,0,0,0,5,0,7,0,0,1,0,8,4,0,0,0,5,8,7,0,0,6,0,0,6,0,0,0,1,5,3,2,0,0,0,0,0,0,0,0,0,3,9,1,6,0,0,0,8,0,0,4,0,0,3,7,6,0,0,0,1,6,0,5,0,0,7,0,7,0,0,0,0,9,2,0,0];
				case "level_356":
					return [0,2,0,0,6,9,0,0,0,0,6,0,0,0,2,0,0,9,4,3,0,0,0,0,6,0,8,0,0,0,0,1,4,7,0,0,3,1,0,0,0,0,0,9,6,0,0,2,6,9,0,0,0,0,9,0,5,0,0,0,0,1,4,1,0,0,8,0,0,0,6,0,0,0,0,9,4,0,0,8,0];
				case "level_357":
					return [0,6,0,0,1,0,0,9,0,0,0,7,5,0,0,8,0,2,5,0,9,0,0,0,0,0,0,7,0,5,4,0,0,0,0,0,0,4,2,8,0,7,6,5,0,0,0,0,0,0,2,3,0,7,0,0,0,0,0,0,1,0,6,6,0,8,0,0,1,5,0,0,0,7,0,0,4,0,0,2,0];
				case "level_358":
					return [9,4,0,0,0,0,0,0,0,0,8,0,0,0,1,6,0,5,2,1,5,0,0,6,0,7,0,0,6,0,0,8,0,7,2,0,4,0,0,0,0,0,0,0,6,0,3,7,0,5,0,0,9,0,0,7,0,3,0,0,9,6,2,6,0,2,4,0,0,0,3,0,0,0,0,0,0,0,0,8,7];
				case "level_359":
					return [7,2,0,9,0,0,0,0,8,0,0,0,0,0,0,0,0,2,0,0,9,4,2,0,3,0,0,6,5,4,0,9,0,0,0,0,2,0,1,0,4,0,7,0,9,0,0,0,0,8,0,2,4,6,0,0,3,0,1,2,9,0,0,5,0,0,0,0,0,0,0,0,9,0,0,0,0,4,0,3,1];
				case "level_360":
					return [0,0,0,0,2,6,7,0,0,9,0,0,3,1,0,0,2,0,0,1,0,0,0,8,0,9,0,0,0,9,0,0,0,2,0,0,3,0,7,0,0,0,5,0,8,0,0,2,0,0,0,4,0,0,0,2,0,7,0,0,0,4,0,0,4,0,0,6,9,0,0,5,0,0,1,8,4,0,0,0,0];
				case "level_361":
					return [8,0,0,0,9,0,0,0,4,4,0,0,6,0,0,0,0,0,0,0,0,2,0,3,1,0,0,3,8,0,0,0,0,7,4,0,1,5,0,0,7,0,0,2,8,0,2,7,0,0,0,0,5,1,0,0,3,4,0,5,0,0,0,0,0,0,0,0,1,0,0,6,6,0,0,0,8,0,0,0,2];
				case "level_362":
					return [0,0,0,0,0,0,8,7,0,0,6,5,0,0,7,4,0,0,8,0,0,0,2,0,0,0,3,0,0,0,0,0,1,7,4,0,7,0,3,4,0,5,6,0,1,0,4,9,6,0,0,0,0,0,6,0,0,0,1,0,0,0,4,0,0,7,2,0,0,5,3,0,0,3,2,0,0,0,0,0,0];
				case "level_363":
					return [3,0,0,0,7,0,0,2,6,0,7,0,0,0,0,0,1,4,5,0,9,4,0,0,0,0,0,0,0,0,8,0,1,2,0,0,9,0,0,0,0,0,0,0,5,0,0,7,2,0,5,0,0,0,0,0,0,0,0,6,1,0,2,1,9,0,0,0,0,0,6,0,2,5,0,0,1,0,0,0,3];
				case "level_364":
					return [0,0,0,0,8,9,0,0,5,0,2,0,4,0,3,1,0,6,0,0,0,0,2,0,9,0,0,0,5,0,6,3,0,7,0,0,0,7,0,8,0,2,0,5,0,0,4,0,0,7,1,0,2,0,0,0,7,0,1,0,0,0,0,9,0,2,3,0,5,0,4,0,3,0,0,9,4,0,0,0,0];
				case "level_365":
					return [0,0,0,0,0,9,1,0,0,0,0,2,0,0,5,3,8,9,5,0,3,0,2,0,0,0,0,4,0,7,5,8,0,0,0,0,0,6,0,0,9,0,0,1,0,0,0,0,0,1,7,5,0,6,0,0,0,0,3,0,9,0,5,9,2,4,7,0,0,6,0,0,0,0,8,9,0,0,0,0,0];
				case "level_366":
					return [4,9,0,2,0,0,0,0,0,0,3,0,8,6,0,0,0,0,0,0,7,0,9,0,2,0,3,7,0,5,0,0,0,0,4,0,0,4,0,0,0,0,0,6,0,0,1,0,0,0,0,8,0,2,8,0,3,0,1,0,9,0,0,0,0,0,0,8,5,0,3,0,0,0,0,0,0,2,0,8,1];
				case "level_367":
					return [0,0,0,0,0,0,0,0,0,0,0,8,3,2,0,5,0,9,0,1,0,0,6,9,0,4,0,5,0,0,1,9,0,0,0,0,1,0,0,2,5,4,0,0,8,0,0,0,0,3,7,0,0,2,0,6,0,4,8,0,0,3,0,7,0,3,0,1,6,8,0,0,0,0,0,0,0,0,0,0,0];
				case "level_368":
					return [0,0,0,0,5,9,0,0,8,0,5,8,0,1,0,2,0,0,0,0,0,0,0,3,0,1,5,1,0,0,0,0,0,5,3,0,4,0,0,0,0,0,0,0,6,0,7,9,0,0,0,0,0,4,2,4,0,3,0,0,0,0,0,0,0,7,0,2,0,3,8,0,8,0,0,5,6,0,0,0,0];
				case "level_369":
					return [0,2,0,5,0,0,1,7,3,1,0,7,8,0,0,0,5,0,0,0,0,0,0,0,2,6,0,2,5,0,0,4,0,0,3,0,0,0,8,0,0,0,7,0,0,0,7,0,0,6,0,0,1,2,0,8,3,0,0,0,0,0,0,0,6,0,0,0,9,4,0,7,4,9,1,0,0,7,0,2,0];
				case "level_370":
					return [0,0,0,9,8,2,0,0,0,0,0,1,0,7,3,2,0,4,0,3,0,6,0,0,0,0,0,0,4,0,0,0,0,0,9,1,0,0,2,0,6,0,5,0,0,7,8,0,0,0,0,0,3,0,0,0,0,0,0,6,0,7,0,1,0,9,7,2,0,4,0,0,0,0,0,8,9,4,0,0,0];
				case "level_371":
					return [0,9,0,2,0,0,0,5,0,0,0,6,5,0,0,0,3,0,3,0,2,0,1,8,0,0,0,7,0,5,0,0,0,0,0,0,2,6,0,0,0,0,0,9,1,0,0,0,0,0,0,5,0,2,0,0,0,6,8,0,9,0,3,0,2,0,0,0,4,8,0,0,0,3,0,0,0,7,0,4,0];
				case "level_372":
					return [0,5,0,0,0,2,0,0,4,0,7,6,9,0,1,5,0,0,0,0,0,0,6,0,0,9,3,0,9,5,3,0,0,0,0,0,0,8,0,0,0,0,0,3,0,0,0,0,0,0,6,4,2,0,9,3,0,0,7,0,0,0,0,0,0,7,8,0,3,2,4,0,5,0,0,2,0,0,0,6,0];
				case "level_373":
					return [0,5,0,0,0,0,2,0,1,0,7,0,9,0,0,0,0,0,9,2,0,0,1,6,0,7,0,0,0,8,0,2,5,7,0,0,0,0,0,0,0,0,0,0,0,0,0,7,8,9,0,5,0,0,0,9,0,5,7,0,0,4,3,0,0,0,0,0,4,0,2,0,3,0,4,0,0,0,0,5,0];
				case "level_374":
					return [0,0,9,0,0,0,3,0,0,6,0,0,0,3,7,0,0,0,1,0,0,0,0,0,0,0,5,0,0,4,0,8,3,0,0,1,3,0,5,1,7,2,9,0,8,9,0,0,6,4,0,2,0,0,5,0,0,0,0,0,0,0,7,0,0,0,8,5,0,0,0,2,0,0,1,0,0,0,4,0,0];
				case "level_375":
					return [1,8,0,5,0,0,9,0,7,0,0,0,0,0,6,0,0,0,3,0,0,0,4,0,0,1,0,4,0,0,0,0,5,0,2,0,0,6,3,0,0,0,5,7,0,0,1,0,2,0,0,0,0,6,0,9,0,0,5,0,0,0,1,0,0,0,7,0,0,0,0,0,5,0,2,0,0,1,0,4,9];
				case "level_376":
					return [6,0,7,0,3,0,0,0,5,0,0,0,8,0,0,0,0,0,1,0,4,5,6,0,0,0,0,0,1,0,0,0,0,9,0,0,3,0,2,9,5,8,1,0,4,0,0,9,0,0,0,0,7,0,0,0,0,0,8,9,2,0,7,0,0,0,0,0,4,0,0,0,7,0,0,0,1,0,3,0,8];
				case "level_377":
					return [7,0,0,0,5,6,0,0,0,0,8,0,0,0,0,0,0,0,5,0,1,0,4,0,0,0,6,0,0,6,0,9,0,4,0,0,8,3,9,0,6,0,2,5,1,0,0,5,0,3,0,8,0,0,9,0,0,0,2,0,7,0,8,0,0,0,0,0,0,0,9,0,0,0,0,3,8,0,0,0,4];
				case "level_378":
					return [6,0,0,8,4,0,0,0,0,0,5,0,0,9,0,4,6,0,4,0,9,3,0,0,0,0,0,0,4,3,0,0,0,0,0,9,2,0,0,0,0,0,0,0,7,7,0,0,0,0,0,1,8,0,0,0,0,0,0,3,7,0,5,0,3,6,0,5,0,0,1,0,0,0,0,0,2,4,0,0,6];
				case "level_379":
					return [2,8,0,0,0,3,0,0,5,0,9,0,0,7,0,0,8,0,0,0,1,0,0,9,0,0,0,6,0,5,4,0,1,0,0,0,4,0,0,0,2,0,0,0,1,0,0,0,5,0,7,8,0,6,0,0,0,7,0,0,5,0,0,0,2,0,0,6,0,0,1,0,8,0,0,1,0,0,0,9,2];
				case "level_380":
					return [0,0,0,8,9,0,0,5,3,0,0,3,0,0,1,0,7,0,0,0,1,0,0,5,6,0,0,0,0,0,0,0,0,0,1,2,9,0,6,0,0,0,7,0,5,5,1,0,0,0,0,0,0,0,0,0,4,2,0,0,3,0,0,0,8,0,4,0,0,5,0,0,3,6,0,0,8,7,0,0,0];
				case "level_381":
					return [1,8,0,0,5,0,0,0,0,3,0,0,4,0,0,0,0,0,5,4,0,1,3,2,0,0,0,9,0,3,6,2,0,0,0,0,6,0,0,0,8,0,0,0,2,0,0,0,0,9,3,6,0,5,0,0,0,3,4,9,0,1,6,0,0,0,0,0,5,0,0,9,0,0,0,0,6,0,0,8,3];
				case "level_382":
					return [0,0,7,0,5,4,0,0,8,0,0,0,0,3,6,0,4,0,0,0,6,0,0,0,0,9,5,1,5,2,0,0,0,0,0,0,0,6,0,0,0,0,0,3,0,0,0,0,0,0,0,2,5,6,4,3,0,0,0,0,7,0,0,0,7,0,1,4,0,0,0,0,6,0,0,5,7,0,9,0,0];
				case "level_383":
					return [3,0,0,8,0,0,0,0,6,4,0,0,0,6,7,3,0,0,0,1,0,9,4,0,0,0,0,0,4,0,0,0,0,0,3,0,0,2,8,0,0,0,7,1,0,0,5,0,0,0,0,0,4,0,0,0,0,0,5,8,0,6,0,0,0,2,3,9,0,0,0,5,5,0,0,0,0,1,0,0,4];
				case "level_384":
					return [8,0,6,0,0,0,0,0,1,0,0,1,9,7,0,6,0,0,0,4,0,5,0,0,0,0,0,0,0,0,7,0,5,4,3,0,3,0,0,0,1,0,0,0,9,0,8,2,4,0,3,0,0,0,0,0,0,0,0,6,0,5,0,0,0,5,0,4,9,1,0,0,6,0,0,0,0,0,8,0,4];
				case "level_385":
					return [0,0,5,0,7,6,3,0,0,0,0,0,0,0,0,0,0,0,4,0,0,2,8,0,0,6,1,0,1,0,5,6,0,0,0,0,0,5,0,8,1,3,0,4,0,0,0,0,0,2,9,0,8,0,2,9,0,0,5,7,0,0,4,0,0,0,0,0,0,0,0,0,0,0,7,3,4,0,2,0,0];
				case "level_386":
					return [5,1,7,6,2,0,0,0,0,0,3,8,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,8,0,1,2,0,0,5,0,0,0,7,5,9,3,6,8,2,0,0,0,9,0,0,5,6,0,7,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1,3,0,0,0,0,0,9,7,2,5,6];
				case "level_387":
					return [0,5,1,0,0,0,0,0,0,0,0,0,0,1,9,0,7,0,4,2,0,6,0,0,0,0,0,0,8,4,0,9,2,0,1,0,9,0,3,8,0,6,7,0,2,0,7,0,5,3,0,4,8,0,0,0,0,0,0,7,0,9,6,0,9,0,1,6,0,0,0,0,0,0,0,0,0,0,8,4,0];
				case "level_388":
					return [0,6,0,0,9,0,0,7,2,0,0,0,1,7,0,0,3,0,0,0,0,0,0,0,6,0,0,5,0,0,0,1,0,0,0,7,6,7,1,0,8,0,5,4,9,8,0,0,0,6,0,0,0,3,0,0,7,0,0,0,0,0,0,0,2,0,0,5,8,0,0,0,4,5,0,0,3,0,0,8,0];
				case "level_389":
					return [1,8,0,0,4,0,9,5,0,0,3,0,0,2,9,8,0,0,0,6,0,0,0,0,0,0,4,0,0,0,2,5,7,0,0,8,0,0,0,0,0,0,0,0,0,4,0,0,9,3,8,0,0,0,7,0,0,0,0,0,0,8,0,0,0,2,5,7,0,0,6,0,0,5,3,0,9,0,0,2,1];
				case "level_390":
					return [2,0,0,8,0,1,0,0,0,0,0,0,0,0,5,0,9,0,0,9,0,0,4,0,0,7,0,6,0,7,0,0,0,1,5,0,0,5,1,0,6,0,7,4,0,0,2,4,0,0,0,8,0,6,0,4,0,0,3,0,0,8,0,0,8,0,9,0,0,0,0,0,0,0,0,7,0,2,0,0,5];
				case "level_391":
					return [0,4,0,6,1,0,0,8,9,1,0,8,0,0,0,0,3,0,0,0,0,0,0,9,0,4,0,0,0,4,3,8,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,9,7,4,0,0,0,8,0,5,0,0,0,0,0,0,3,0,0,0,0,5,0,2,2,5,0,0,4,3,0,9,0];
				case "level_392":
					return [0,0,3,5,8,2,0,0,0,0,0,0,0,6,0,0,8,0,1,5,0,0,0,0,0,0,2,6,0,4,0,0,0,0,1,0,0,9,5,0,0,0,2,4,0,0,7,0,0,0,0,6,0,3,9,0,0,0,0,0,0,2,5,0,1,0,0,7,0,0,0,0,0,0,0,1,3,5,9,0,0];
				case "level_393":
					return [0,5,1,0,3,9,7,0,0,9,0,0,4,7,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,5,0,2,0,0,3,0,2,6,4,0,7,0,0,6,0,3,8,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,9,8,0,0,4,0,0,7,1,2,0,6,8,0];
				case "level_394":
					return [0,0,0,6,0,0,0,0,9,0,3,8,0,9,0,0,1,2,0,2,9,0,0,0,6,0,0,0,0,0,3,0,5,0,0,4,0,8,0,0,0,0,0,6,0,7,0,0,2,0,8,0,0,0,0,0,7,0,0,0,8,3,0,3,1,0,0,2,0,4,7,0,8,0,0,0,0,3,0,0,0];
				case "level_395":
					return [0,0,0,9,0,5,0,0,8,0,2,0,0,3,0,0,1,0,0,1,0,4,0,0,0,0,0,0,4,9,0,0,0,2,0,7,0,3,2,0,7,0,9,4,0,7,0,5,0,0,0,3,8,0,0,0,0,0,0,1,0,5,0,0,5,0,0,6,0,0,3,0,4,0,0,8,0,2,0,0,0];
				case "level_396":
					return [0,0,0,3,0,8,0,9,6,8,0,0,0,0,0,5,0,0,6,0,7,0,9,0,4,0,0,4,0,8,0,0,0,0,7,1,0,7,0,0,0,0,0,5,0,9,1,0,0,0,0,6,0,4,0,0,4,0,3,0,9,0,2,0,0,3,0,0,0,0,0,7,7,8,0,1,0,6,0,0,0];
				case "level_397":
					return [0,0,0,0,0,0,0,5,0,0,8,9,1,0,0,0,3,0,3,0,0,7,8,0,0,0,9,7,6,1,0,4,0,0,0,0,2,3,0,0,1,0,0,7,8,0,0,0,0,3,0,5,6,1,9,0,0,0,7,1,0,0,3,0,4,0,0,0,3,7,2,0,0,7,0,0,0,0,0,0,0];
				case "level_398":
					return [0,0,0,1,8,0,9,0,2,9,0,5,7,0,0,6,0,0,0,0,0,0,6,9,8,0,0,0,0,4,0,0,0,0,0,7,6,0,0,0,7,0,0,0,4,7,0,0,0,0,0,2,0,0,0,0,6,9,2,0,0,0,0,0,0,7,0,0,1,3,0,6,5,0,9,0,4,6,0,0,0];
				case "level_399":
					return [0,0,6,5,4,0,7,0,3,0,7,0,8,2,0,0,1,0,0,0,4,3,0,0,0,0,0,0,8,7,0,0,0,0,0,0,0,4,0,7,8,9,0,2,0,0,0,0,0,0,0,8,4,0,0,0,0,0,0,8,1,0,0,0,1,0,0,6,4,0,7,0,4,0,9,0,7,5,2,0,0];
				case "level_400":
					return [5,0,4,9,2,0,0,0,0,2,0,3,0,8,0,0,0,9,0,0,0,1,0,0,0,0,0,0,5,0,0,0,0,6,0,0,8,0,7,6,9,1,5,0,4,0,0,6,0,0,0,0,3,0,0,0,0,0,0,4,0,0,0,3,0,0,0,5,0,8,0,1,0,0,0,0,1,6,7,0,3];
				case "level_401":
					return [1,0,0,5,0,0,0,3,8,0,0,0,0,4,6,1,0,0,2,0,0,0,0,0,0,7,0,3,0,0,0,0,0,2,9,0,4,0,0,8,9,3,0,0,5,0,9,5,0,0,0,0,0,3,0,1,0,0,0,0,0,0,7,0,0,4,2,6,0,0,0,0,5,2,0,0,0,9,0,0,4];
				case "level_402":
					return [0,0,0,5,8,2,0,0,0,0,9,0,7,0,0,0,0,0,3,0,0,0,1,9,6,0,2,0,6,0,0,0,0,3,5,0,2,0,0,0,7,0,0,0,4,0,8,1,0,0,0,0,9,0,5,0,3,1,2,0,0,0,6,0,0,0,0,0,7,0,1,0,0,0,0,8,5,6,0,0,0];
				case "level_403":
					return [8,0,0,0,0,0,0,7,0,0,0,0,3,8,0,9,0,0,0,7,5,0,1,4,0,8,0,1,0,0,4,0,0,6,9,0,9,0,0,0,0,0,0,0,7,0,5,6,0,0,9,0,0,4,0,6,0,7,4,0,3,1,0,0,0,1,0,5,2,0,0,0,0,2,0,0,0,0,0,0,6];
				case "level_404":
					return [0,0,0,3,9,0,0,0,7,0,0,3,7,0,0,0,0,9,0,9,5,0,0,0,2,0,4,0,8,0,2,6,0,0,0,0,3,0,9,0,0,0,4,0,6,0,0,0,0,3,9,0,7,0,6,0,2,0,0,0,3,1,0,9,0,0,0,0,5,6,0,0,5,0,0,0,2,3,0,0,0];
				case "level_405":
					return [0,9,5,2,0,4,7,0,0,0,0,4,5,0,0,0,3,1,7,0,0,8,0,0,0,0,0,0,0,0,4,0,0,0,1,2,0,8,3,0,0,0,5,7,0,2,7,0,0,0,5,0,0,0,0,0,0,0,0,6,0,0,3,6,4,0,0,0,3,1,0,0,0,0,7,1,0,8,9,4,0];
				case "level_406":
					return [2,0,7,0,0,4,3,0,0,0,8,0,2,5,0,6,0,0,0,0,0,1,0,0,0,5,0,0,0,2,8,6,0,0,0,9,0,3,0,0,1,0,0,4,0,1,0,0,0,3,2,5,0,0,0,4,0,0,0,1,0,0,0,0,0,9,0,7,8,0,6,0,0,0,3,9,0,0,7,0,5];
				case "level_407":
					return [0,0,8,0,7,2,0,1,4,0,4,7,0,0,0,0,0,0,3,0,0,0,0,4,0,0,2,5,2,0,0,0,1,0,0,7,0,0,1,0,0,0,9,0,0,8,0,0,7,0,0,0,2,6,1,0,0,3,0,0,0,0,9,0,0,0,0,0,0,8,3,0,9,3,0,8,6,0,7,0,0];
				case "level_408":
					return [0,0,9,0,0,0,1,0,0,5,0,0,0,0,0,0,0,2,0,0,0,6,5,0,4,0,0,0,0,1,5,7,0,0,0,3,2,0,7,8,6,1,5,0,9,8,0,0,0,3,4,2,0,0,0,0,8,0,9,7,0,0,0,3,0,0,0,0,0,0,0,1,0,0,6,0,0,0,9,0,0];
				case "level_409":
					return [5,0,0,8,0,4,3,0,0,7,9,0,2,0,1,5,0,0,0,0,6,0,0,7,0,0,9,0,0,0,1,8,0,0,0,3,0,0,0,0,4,0,0,0,0,8,0,0,0,2,9,0,0,0,1,0,0,6,0,0,9,0,0,0,0,9,4,0,5,0,6,8,0,0,7,9,0,8,0,0,1];
				case "level_410":
					return [9,0,0,0,0,0,0,1,0,3,8,0,0,7,0,0,4,0,0,0,0,2,0,9,7,0,3,4,9,0,0,0,0,8,0,5,0,0,8,0,0,0,1,0,0,7,0,5,0,0,0,0,3,4,8,0,9,5,0,3,0,0,0,0,4,0,0,2,0,0,7,6,0,2,0,0,0,0,0,0,8];
				case "level_411":
					return [0,5,0,0,0,0,0,6,0,0,0,3,0,2,8,0,0,0,0,0,7,0,0,0,2,0,0,0,3,0,0,5,1,4,0,0,0,4,8,3,7,6,9,2,0,0,0,6,9,8,0,0,5,0,0,0,2,0,0,0,6,0,0,0,0,0,7,9,0,1,0,0,0,9,0,0,0,0,0,4,0];
				case "level_412":
					return [2,9,4,0,5,0,0,0,0,0,1,0,0,9,0,5,6,0,0,0,0,0,0,2,0,7,0,0,0,0,0,0,4,8,0,6,4,0,0,5,0,6,0,0,1,6,0,2,1,0,0,0,0,0,0,4,0,3,0,0,0,0,0,0,8,6,0,4,0,0,1,0,0,0,0,0,6,0,4,5,8];
				case "level_413":
					return [0,3,1,8,2,0,5,0,0,0,0,0,4,1,5,0,0,0,0,0,0,0,0,9,0,0,8,4,8,0,0,0,0,0,0,6,0,0,2,0,9,0,7,0,0,5,0,0,0,0,0,0,3,1,6,0,0,9,0,0,0,0,0,0,0,0,1,4,2,0,0,0,0,0,3,0,8,6,2,5,0];
				case "level_414":
					return [0,8,0,3,5,0,0,0,6,0,4,9,0,0,0,0,0,5,0,0,5,2,4,0,0,0,0,0,0,0,0,0,0,3,8,7,0,0,8,0,0,0,9,0,0,7,2,3,0,0,0,0,0,0,0,0,0,0,9,8,4,0,0,8,0,0,0,0,0,6,3,0,5,0,0,0,3,4,0,1,0];
				case "level_415":
					return [0,5,0,0,0,8,0,0,6,4,0,0,1,0,7,0,2,0,8,0,6,9,0,3,0,4,0,0,0,0,3,1,0,0,0,2,0,0,0,0,7,0,0,0,0,1,0,0,0,9,6,0,0,0,0,6,0,7,0,4,5,0,1,0,8,0,6,0,1,0,0,3,3,0,0,5,0,0,0,6,0];
				case "level_416":
					return [0,9,8,0,3,1,2,0,0,0,0,2,9,0,0,0,0,0,0,0,7,0,0,0,0,3,8,4,0,0,0,8,7,0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,4,9,0,0,0,7,5,6,0,0,0,0,7,0,0,0,0,0,0,0,5,8,0,0,0,0,9,7,2,0,5,6,0];
				case "level_417":
					return [9,8,0,0,7,0,5,0,1,0,0,0,4,0,0,7,0,0,5,7,0,0,0,0,0,4,0,0,0,0,9,0,3,2,0,0,8,0,0,0,0,0,0,0,4,0,0,6,5,0,8,0,0,0,0,6,0,0,0,0,0,8,9,0,0,8,0,0,9,0,0,0,1,0,9,0,5,0,0,2,6];
				case "level_418":
					return [6,0,0,7,2,0,1,0,9,9,0,0,0,0,0,0,6,0,0,0,5,0,6,3,0,0,0,5,0,4,0,0,7,0,2,0,0,9,0,0,0,0,0,5,0,0,7,0,5,0,0,4,0,1,0,0,0,8,1,0,2,0,0,0,4,0,0,0,0,0,0,8,2,0,3,0,7,9,0,0,4];
				case "level_419":
					return [6,2,0,0,0,7,0,3,0,0,0,0,6,9,0,0,0,2,0,0,5,4,0,0,8,0,0,0,0,6,0,3,8,0,9,0,8,3,0,0,0,0,0,1,7,0,5,0,2,1,0,3,0,0,0,0,8,0,0,5,7,0,0,5,0,0,0,4,9,0,0,0,0,4,0,8,0,0,0,5,9];
				case "level_420":
					return [4,0,9,8,3,0,5,0,0,5,7,0,0,2,0,0,0,4,8,0,0,0,0,5,0,0,0,0,0,6,0,1,0,3,0,0,7,0,0,9,0,2,0,0,6,0,0,8,0,5,0,9,0,0,0,0,0,4,0,0,0,0,3,3,0,0,0,7,0,0,9,1,0,0,7,0,9,3,4,0,8];
				case "level_421":
					return [0,0,6,0,0,5,0,8,0,0,0,5,0,0,3,7,0,0,0,0,0,9,2,0,0,3,6,0,0,0,0,0,0,0,5,4,2,0,7,0,0,0,8,0,3,3,5,0,0,0,0,0,0,0,6,7,0,0,9,8,0,0,0,0,0,1,4,0,0,6,0,0,0,9,0,1,0,0,3,0,0];
				case "level_422":
					return [1,0,3,0,8,0,0,0,0,0,0,0,0,0,2,0,0,6,8,0,0,0,0,3,2,7,1,9,0,5,3,7,0,0,0,0,0,4,0,0,2,0,0,6,0,0,0,0,0,6,9,4,0,3,5,8,2,9,0,0,0,0,4,7,0,0,2,0,0,0,0,0,0,0,0,0,1,0,3,0,2];
				case "level_423":
					return [0,0,1,5,0,9,7,6,0,0,0,0,0,0,4,5,0,2,0,0,5,0,6,7,0,3,0,1,0,0,0,0,0,0,0,7,0,4,0,9,0,3,0,8,0,5,0,0,0,0,0,0,0,9,0,5,0,6,4,0,2,0,0,2,0,4,8,0,0,0,0,0,0,1,7,3,0,2,6,0,0];
				case "level_424":
					return [0,3,0,0,8,0,0,9,5,5,0,0,3,1,0,0,2,0,6,0,0,4,0,0,3,0,0,0,7,0,0,0,5,1,4,9,0,0,0,0,0,0,0,0,0,8,1,6,9,0,0,0,5,0,0,0,8,0,0,4,0,0,7,0,5,0,0,3,7,0,0,8,7,2,0,0,9,0,0,3,0];
				case "level_425":
					return [2,8,0,0,0,6,0,4,0,9,0,0,0,0,0,0,5,0,0,0,4,3,7,0,0,0,0,1,0,5,0,0,0,0,2,0,0,6,0,2,1,8,0,7,0,0,2,0,0,0,0,6,0,1,0,0,0,0,3,5,7,0,0,0,9,0,0,0,0,0,0,4,0,7,0,1,0,0,0,6,5];
				case "level_426":
					return [6,8,0,0,2,0,0,0,1,4,0,0,6,7,8,0,0,0,0,0,3,0,9,0,0,0,0,0,0,0,0,0,0,0,1,0,7,6,0,5,1,3,0,9,8,0,5,0,0,0,0,0,0,0,0,0,0,0,5,0,6,0,0,0,0,0,9,3,1,0,0,2,3,0,0,0,6,0,0,4,9];
				case "level_427":
					return [8,5,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,7,9,4,3,6,0,0,0,0,9,0,8,6,0,0,0,0,4,4,7,0,2,5,3,0,6,8,2,0,0,0,0,4,7,0,3,0,0,0,0,2,7,3,4,6,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,5,9];
				case "level_428":
					return [3,0,0,6,4,0,0,0,7,1,4,0,0,0,0,0,9,0,0,0,7,9,0,0,0,0,0,0,0,0,2,0,4,1,0,5,0,6,0,0,3,0,0,2,0,4,0,2,7,0,8,0,0,0,0,0,0,0,0,7,4,0,0,0,3,0,0,0,0,0,1,9,9,0,0,0,8,6,0,0,3];
				case "level_429":
					return [0,9,0,0,5,0,0,0,0,0,0,4,9,0,0,0,0,0,0,1,2,7,0,6,0,0,5,0,0,0,0,7,0,3,4,0,0,0,6,5,0,9,2,0,0,0,7,1,0,6,0,0,0,0,5,0,0,4,0,2,9,1,0,0,0,0,0,0,5,7,0,0,0,0,0,0,1,0,0,3,0];
				case "level_430":
					return [0,4,0,8,0,0,0,0,0,0,0,0,2,0,5,7,0,0,0,6,0,0,1,0,0,4,0,6,5,0,0,0,0,9,0,4,3,7,0,0,9,0,0,6,2,2,0,9,0,0,0,0,7,3,0,8,0,0,6,0,0,2,0,0,0,5,4,0,3,0,0,0,0,0,0,0,0,7,0,8,0];
				case "level_431":
					return [0,0,0,1,0,3,0,0,2,1,4,2,0,0,0,0,3,0,0,9,0,0,0,0,0,0,7,0,0,4,0,0,1,0,6,0,0,3,0,8,0,2,0,7,0,0,1,0,5,0,0,8,0,0,9,0,0,0,0,0,0,8,0,0,8,0,0,0,0,3,2,1,4,0,0,3,0,5,0,0,0];
				case "level_432":
					return [0,0,1,0,0,0,4,0,5,0,0,0,1,7,5,0,3,0,7,0,0,0,8,0,0,0,0,4,0,0,0,0,0,8,2,0,2,1,0,0,0,0,0,5,9,0,8,3,0,0,0,0,0,6,0,0,0,0,6,0,0,0,4,0,9,0,5,3,4,0,0,0,1,0,5,0,0,0,9,0,0];
				case "level_433":
					return [0,4,0,0,5,2,8,0,0,0,7,0,4,0,0,0,5,1,0,0,9,0,0,3,0,0,0,3,0,0,0,7,6,0,1,0,0,0,7,0,3,0,9,0,0,0,6,0,2,8,0,0,0,4,0,0,0,3,0,0,1,0,0,6,5,0,0,0,9,0,7,0,0,0,2,6,1,0,0,8,0];
				case "level_434":
					return [8,0,0,7,2,0,0,1,0,0,6,0,0,0,5,0,7,3,0,4,0,0,3,0,0,0,0,0,0,9,4,0,0,0,6,0,6,0,0,0,0,0,0,0,5,0,7,0,0,0,6,2,0,0,0,0,0,0,6,0,0,8,0,7,8,0,2,0,0,0,9,0,0,5,0,0,9,4,0,0,7];
				case "level_435":
					return [7,9,0,0,0,0,0,0,3,0,0,0,9,0,0,7,0,0,1,3,0,0,2,0,9,5,0,0,0,0,7,0,2,3,0,0,0,4,0,0,0,0,0,7,0,0,0,1,6,0,9,0,0,0,0,5,2,0,8,0,0,9,7,0,0,8,0,0,4,0,0,0,4,0,0,0,0,0,0,2,8];
				case "level_436":
					return [7,8,1,0,0,0,0,6,0,0,0,0,3,0,1,0,0,2,0,6,0,0,0,0,0,0,5,0,0,6,0,0,3,0,7,0,0,4,0,8,0,6,0,1,0,0,9,0,7,0,0,2,0,0,4,0,0,0,0,0,0,5,0,8,0,0,1,0,7,0,0,0,0,1,0,0,0,0,8,2,7];
				case "level_437":
					return [0,1,3,0,6,9,2,0,0,4,0,0,0,5,1,0,0,6,0,0,0,0,0,7,4,0,0,0,0,0,0,0,0,7,0,1,1,0,0,6,7,3,0,0,2,7,0,6,0,0,0,0,0,0,0,0,1,8,0,0,0,0,0,6,0,0,7,2,0,0,0,4,0,0,5,9,1,0,6,8,0];
				case "level_438":
					return [0,9,8,0,5,0,0,7,4,0,6,0,0,3,4,0,0,9,0,2,0,0,0,0,5,0,0,0,0,0,3,7,1,9,0,0,0,0,0,0,0,0,0,0,0,0,0,5,4,6,9,0,0,0,0,0,1,0,0,0,0,9,0,3,0,0,7,1,0,0,2,0,6,7,0,0,4,0,8,3,0];
				case "level_439":
					return [0,5,0,0,7,0,0,0,4,0,0,7,3,0,0,9,0,0,0,6,0,0,1,5,0,3,0,5,0,6,0,0,9,0,7,0,8,0,0,1,0,3,0,0,5,0,9,0,4,0,0,8,0,2,0,8,0,6,3,0,0,4,0,0,0,9,0,0,2,6,0,0,6,0,0,0,9,0,0,2,0];
				case "level_440":
					return [0,0,1,0,6,0,9,7,0,6,5,0,9,0,0,0,0,0,7,0,0,2,8,0,0,0,0,0,1,4,0,0,0,0,0,5,5,0,0,0,0,0,0,0,8,3,0,0,0,0,0,2,9,0,0,0,0,0,2,4,0,0,7,0,0,0,0,0,9,0,3,2,0,2,7,0,3,0,6,0,0];
				case "level_441":
					return [4,2,1,0,0,0,0,0,7,0,0,0,0,0,0,0,1,6,5,0,0,0,0,1,8,0,0,0,0,0,1,0,9,0,6,0,6,9,0,3,0,7,0,4,8,0,7,0,6,0,4,0,0,0,0,0,9,8,0,0,0,0,5,3,4,0,0,0,0,0,0,0,7,0,0,0,0,0,2,3,1];
				case "level_442":
					return [0,0,6,9,0,0,0,0,0,5,2,0,0,0,0,0,1,0,1,0,0,7,3,0,0,0,5,0,0,0,3,0,9,4,0,6,0,4,0,0,1,0,0,7,0,8,0,2,6,0,4,0,0,0,9,0,0,0,6,7,0,0,1,0,5,0,0,0,0,0,6,2,0,0,0,0,0,5,9,0,0];
				case "level_443":
					return [8,0,0,7,0,0,4,2,3,0,3,2,9,0,0,0,0,7,0,0,0,0,0,0,0,8,6,7,0,8,0,1,0,0,0,4,0,9,0,0,0,0,0,3,0,3,0,0,0,6,0,8,0,2,9,4,0,0,0,0,0,0,0,6,0,0,0,0,5,3,1,0,5,2,1,0,0,3,0,0,8];
				case "level_444":
					return [0,7,0,0,1,9,6,0,0,0,0,0,0,0,8,0,1,7,0,9,0,7,0,4,5,2,0,3,0,0,0,0,0,0,0,6,0,0,8,4,0,3,1,0,0,2,0,0,0,0,0,0,0,5,0,2,9,3,0,6,0,5,0,7,6,0,1,0,0,0,0,0,0,0,4,2,9,0,0,6,0];
				case "level_445":
					return [0,0,0,9,4,0,0,1,3,7,0,0,0,0,0,0,0,0,0,0,0,5,0,0,8,0,9,1,0,0,0,7,0,0,8,5,0,0,9,4,0,5,7,0,0,3,7,0,0,8,0,0,0,4,9,0,2,0,0,1,0,0,0,0,0,0,0,0,0,0,0,7,8,5,0,0,3,2,0,0,0];
				case "level_446":
					return [0,9,0,0,2,6,7,0,0,0,1,7,0,3,0,0,6,0,6,0,0,0,0,4,8,0,0,2,4,1,7,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,1,3,2,8,0,0,5,4,0,0,0,0,3,0,6,0,0,1,0,5,9,0,0,0,3,5,6,0,0,7,0];
				case "level_447":
					return [0,0,4,0,0,1,0,5,0,1,6,0,3,0,7,4,0,0,0,5,0,6,0,4,8,0,0,0,0,0,4,2,0,0,6,0,0,0,0,0,7,0,0,0,0,0,9,0,0,6,5,0,0,0,0,0,9,7,0,6,0,3,0,0,0,3,5,0,2,0,8,4,0,4,0,8,0,0,1,0,0];
				case "level_448":
					return [4,0,0,8,0,0,0,0,2,0,8,0,0,2,0,4,0,0,0,5,0,0,6,4,0,9,0,9,0,8,0,0,5,0,2,0,0,0,1,6,0,7,9,0,0,0,3,0,2,0,0,1,0,4,0,6,0,1,7,0,0,4,0,0,0,5,0,3,0,0,1,0,2,0,0,0,0,6,0,0,3];
				case "level_449":
					return [0,0,0,8,0,0,0,0,7,2,0,0,6,7,0,0,4,0,0,5,6,0,0,1,0,3,0,0,6,0,2,4,0,9,0,0,3,0,0,0,8,0,0,0,1,0,0,8,0,3,6,0,7,0,0,3,0,9,0,0,7,5,0,0,9,0,0,5,2,0,0,4,1,0,0,0,0,8,0,0,0];
				case "level_450":
					return [0,0,9,0,5,6,3,2,0,0,0,0,9,3,7,0,0,0,6,0,0,1,0,0,0,0,0,8,0,0,0,0,0,0,6,7,0,0,4,0,1,0,5,0,0,3,2,0,0,0,0,0,0,9,0,0,0,0,0,1,0,0,8,0,0,0,5,7,3,0,0,0,0,9,5,8,6,0,2,0,0];
				case "level_451":
					return [0,3,0,2,8,0,0,0,9,0,5,7,0,0,0,0,0,8,0,0,8,1,5,0,0,0,0,0,0,0,0,0,0,2,3,4,0,0,3,0,0,0,7,0,0,4,1,2,0,0,0,0,0,0,0,0,0,0,7,3,5,0,0,3,0,0,0,0,0,9,2,0,8,0,0,0,2,5,0,6,0];
				case "level_452":
					return [6,7,8,0,4,0,0,0,9,3,0,0,0,0,0,0,0,0,0,0,9,3,0,7,1,0,0,0,0,7,0,2,0,0,1,0,5,0,3,1,0,6,7,0,2,0,9,0,0,3,0,8,0,0,0,0,5,8,0,4,3,0,0,0,0,0,0,0,0,0,0,5,7,0,0,0,5,0,9,8,1];
				case "level_453":
					return [0,8,7,0,6,1,4,0,0,0,0,0,0,0,0,0,0,0,1,0,0,5,4,0,0,0,7,0,0,0,0,7,8,0,3,0,0,6,0,3,9,5,0,4,0,0,9,0,6,2,0,0,0,0,6,0,0,0,1,2,0,0,5,0,0,0,0,0,0,0,0,0,0,0,4,7,3,0,9,2,0];
				case "level_454":
					return [1,3,0,0,0,0,4,0,0,0,0,0,0,0,2,7,0,0,0,0,7,9,3,0,1,2,0,7,0,0,4,1,0,0,0,6,0,0,0,0,0,0,0,0,0,4,0,0,0,2,6,0,0,7,0,5,8,0,7,4,2,0,0,0,0,1,8,0,0,0,0,0,0,0,4,0,0,0,0,5,8];
				case "level_455":
					return [0,6,0,5,0,4,1,0,0,0,0,1,7,0,0,0,5,0,0,5,0,8,0,9,4,0,7,0,0,4,0,2,5,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,1,4,0,3,0,0,5,0,6,2,0,1,0,9,0,0,7,0,0,0,6,5,0,0,0,0,9,4,0,8,0,3,0];
				case "level_456":
					return [0,0,0,0,7,0,0,0,3,2,0,7,4,0,0,0,0,6,5,0,0,0,1,2,9,0,0,6,0,0,0,0,3,0,8,0,0,0,4,0,0,0,6,0,0,0,1,0,6,0,0,0,0,2,0,0,2,3,8,0,0,0,4,8,0,0,0,0,1,2,0,9,9,0,0,0,6,0,0,0,0];
				case "level_457":
					return [0,7,8,0,0,0,5,0,2,0,2,0,8,0,1,0,0,0,4,0,5,0,9,0,0,0,0,8,3,1,0,4,0,2,0,0,5,0,0,0,0,0,0,0,3,0,0,7,0,1,0,4,9,5,0,0,0,0,3,0,6,0,7,0,0,0,6,0,7,0,2,0,7,0,6,0,0,0,8,3,0];
				case "level_458":
					return [2,0,9,0,0,7,3,4,0,0,0,0,1,0,0,0,0,0,0,3,0,0,9,0,7,0,0,0,7,0,2,0,0,8,0,0,5,8,0,0,0,0,0,1,9,0,0,4,0,0,9,0,2,0,0,0,5,0,4,0,0,7,0,0,0,0,0,0,8,0,0,0,0,6,7,9,0,0,1,0,3];
				case "level_459":
					return [0,0,0,0,0,0,9,0,0,8,0,3,0,5,4,0,0,0,0,7,4,0,0,2,0,0,0,7,0,2,0,9,0,8,0,0,0,9,0,2,0,5,0,4,0,0,0,5,0,7,0,3,0,9,0,0,0,8,0,0,4,6,0,0,0,0,6,3,0,7,0,2,0,0,9,0,0,0,0,0,0];
				case "level_460":
					return [2,0,6,0,0,0,0,0,0,0,0,8,0,0,1,0,9,7,5,7,1,0,0,9,3,0,0,0,0,9,0,8,0,5,3,0,6,0,0,0,0,0,0,0,9,0,3,4,0,7,0,2,0,0,0,0,3,4,0,0,9,2,5,9,5,0,6,0,0,4,0,0,0,0,0,0,0,0,8,0,3];
				case "level_461":
					return [0,9,1,2,7,0,6,0,0,0,0,0,1,4,8,0,0,0,0,0,0,0,0,3,0,0,2,8,6,0,0,0,0,0,0,9,0,0,5,0,3,0,1,0,0,2,0,0,0,0,0,0,7,4,7,0,0,3,0,0,0,0,0,0,0,0,9,8,4,0,0,0,0,0,9,0,1,7,8,6,0];
				case "level_462":
					return [8,0,0,1,5,0,0,0,0,0,0,4,2,0,0,5,0,0,0,0,5,0,6,9,0,3,0,4,0,0,0,0,0,0,0,5,2,7,0,0,0,0,0,1,3,9,0,0,0,0,0,0,0,4,0,9,0,7,8,0,4,0,0,0,0,8,0,0,1,9,0,0,0,0,0,0,4,6,0,0,2];
				case "level_463":
					return [0,0,0,0,9,3,0,0,2,0,0,2,5,0,0,4,1,0,0,0,8,0,0,0,0,6,0,0,0,1,0,0,0,0,7,8,0,0,9,4,7,1,5,0,0,5,7,0,0,0,0,1,0,0,0,2,0,0,0,0,6,0,0,0,8,5,0,0,7,9,0,0,9,0,0,8,3,0,0,0,0];
				case "level_464":
					return [0,4,0,0,2,0,0,8,6,0,0,8,3,6,0,0,0,0,2,0,6,9,0,0,0,0,0,9,6,0,0,0,0,2,0,0,0,0,1,0,0,0,7,0,0,0,0,7,0,0,0,0,3,5,0,0,0,0,0,9,4,0,7,0,0,0,0,1,6,8,0,0,8,9,0,0,4,0,0,5,0];
				case "level_465":
					return [0,0,0,8,0,9,5,0,0,0,0,0,0,2,0,0,7,3,5,7,0,0,0,0,4,9,0,0,5,0,0,3,0,6,8,9,6,0,0,0,0,0,0,0,7,7,3,2,0,8,0,0,4,0,0,9,6,0,0,0,0,1,4,4,1,0,0,6,0,0,0,0,0,0,5,4,0,1,0,0,0];
				case "level_466":
					return [0,2,0,6,0,0,0,0,0,0,7,0,0,3,0,0,2,0,0,0,0,4,0,1,0,0,5,0,1,7,0,0,0,2,0,8,0,5,9,0,8,0,4,7,0,8,0,4,0,0,0,9,5,0,1,0,0,2,0,9,0,0,0,0,6,0,0,7,0,0,4,0,0,0,0,0,0,5,0,6,0];
				case "level_467":
					return [8,0,0,0,9,4,1,7,0,0,3,0,0,0,7,0,4,0,9,0,7,0,0,0,0,0,0,0,6,4,0,0,1,0,9,0,1,0,0,0,0,0,0,0,5,0,8,0,9,0,0,4,2,0,0,0,0,0,0,0,3,0,8,0,1,0,3,0,0,0,5,0,0,5,3,8,2,0,0,0,9];
				case "level_468":
					return [0,0,9,0,0,0,7,8,1,0,1,0,9,0,8,0,0,0,0,2,0,0,0,0,4,0,0,0,0,6,8,0,0,0,0,7,0,0,2,1,0,3,9,0,0,3,0,0,0,0,5,8,0,0,0,0,3,0,0,0,0,4,0,0,0,0,5,0,9,0,7,0,9,8,1,0,0,0,3,0,0];
				case "level_469":
					return [6,0,2,0,0,0,0,0,0,0,0,0,0,6,7,4,0,0,0,9,8,3,0,0,0,0,0,9,0,1,0,7,8,6,0,0,5,7,0,1,0,3,0,8,4,0,0,4,2,5,0,1,0,9,0,0,0,0,0,4,7,3,0,0,0,7,6,3,0,0,0,0,0,0,0,0,0,0,9,0,1];
				case "level_470":
					return [3,7,5,0,4,0,0,0,0,0,0,0,0,0,8,0,5,0,0,6,0,0,5,0,4,3,0,0,0,0,0,0,6,2,0,4,6,0,0,4,0,7,0,0,5,4,0,3,5,0,0,0,0,0,0,4,7,0,9,0,0,6,0,0,1,0,2,0,0,0,0,0,0,0,0,0,7,0,5,9,2];
				case "level_471":
					return [0,0,6,5,8,0,9,0,0,8,0,4,0,0,0,0,0,3,0,9,0,3,0,0,0,0,0,0,0,0,1,0,8,7,4,0,5,0,0,0,6,0,0,0,1,0,1,8,9,0,2,0,0,0,0,0,0,0,0,9,0,8,0,6,0,0,0,0,0,3,0,4,0,0,3,0,2,5,6,0,0];
				case "level_472":
					return [6,0,0,0,2,7,9,0,0,2,0,0,0,0,0,8,4,0,0,0,0,0,8,5,0,2,0,3,7,9,0,0,0,0,0,0,0,4,0,0,0,0,0,9,0,0,0,0,0,0,0,5,7,3,0,8,0,9,4,0,0,0,0,0,6,7,0,0,0,0,0,9,0,0,1,8,7,0,0,0,2];
				case "level_473":
					return [2,0,0,0,0,1,0,0,0,4,1,0,2,3,0,0,6,0,5,0,3,0,6,0,0,0,2,0,3,0,0,8,0,0,4,0,9,0,0,7,0,3,0,0,6,0,2,0,0,5,0,0,9,0,1,0,0,0,7,0,6,0,8,0,8,0,0,2,4,0,3,1,0,0,0,8,0,0,0,0,4];
				case "level_474":
					return [0,0,0,9,0,1,3,0,0,1,9,0,0,0,0,8,6,0,0,0,0,0,8,0,0,9,1,0,1,0,0,4,0,5,7,2,2,0,0,0,0,0,0,0,8,6,4,8,0,7,0,0,3,0,7,2,0,0,5,0,0,0,0,0,6,1,0,0,0,0,2,3,0,0,3,6,0,4,0,0,0];
				case "level_475":
					return [3,0,2,9,0,0,0,0,0,8,1,0,0,0,0,0,0,0,0,0,0,0,1,5,0,0,7,6,2,0,0,5,3,0,0,1,0,4,5,6,0,9,3,7,0,7,0,0,8,4,0,0,2,6,5,0,0,1,9,0,0,0,0,0,0,0,0,0,0,0,6,2,0,0,0,0,0,7,9,0,5];
				case "level_476":
					return [6,3,0,0,4,0,0,0,5,0,0,0,0,3,0,7,2,4,9,0,0,7,0,0,0,0,0,0,8,6,2,0,0,0,0,0,0,0,5,6,0,3,2,0,0,0,0,0,0,0,5,6,7,0,0,0,0,0,0,1,0,0,2,3,2,8,0,6,0,0,0,0,5,0,0,0,2,0,0,6,8];
				case "level_477":
					return [0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,3,2,0,0,0,0,0,8,4,9,6,7,0,7,0,0,0,8,0,9,2,0,2,8,4,3,5,6,7,0,6,4,0,7,0,0,0,5,0,4,8,7,6,5,0,0,0,0,0,9,3,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0];
				case "level_478":
					return [3,0,0,1,5,0,0,7,0,4,1,0,0,9,0,8,3,0,0,0,5,0,0,0,0,2,0,0,0,6,9,4,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1,5,2,0,0,0,7,0,0,0,0,6,0,0,0,2,8,0,6,0,0,1,9,0,4,0,0,3,9,0,0,2];
				case "level_479":
					return [0,6,3,4,0,0,0,0,0,1,0,0,5,0,0,0,0,0,0,0,7,0,9,3,8,6,0,2,0,0,0,3,0,4,0,0,8,0,0,0,4,0,0,0,2,0,0,9,0,7,0,0,0,5,0,5,1,3,8,0,9,0,0,0,0,0,0,0,9,0,0,8,0,0,0,0,0,4,5,1,0];
				case "level_480":
					return [0,3,0,0,0,9,2,0,0,6,0,2,0,4,0,0,0,8,5,0,0,0,8,2,3,0,0,1,7,3,4,0,0,0,0,5,0,0,0,0,0,0,0,0,0,2,0,0,0,0,5,4,1,9,0,0,5,8,1,0,0,0,6,8,0,0,0,3,0,5,0,4,0,0,7,9,0,0,0,8,0];
				case "level_481":
					return [0,1,0,2,0,0,0,0,0,2,0,0,0,8,0,0,0,0,9,6,0,7,0,5,8,0,0,0,0,0,0,7,0,0,4,1,0,5,0,8,0,2,0,6,0,7,9,0,0,5,0,0,0,0,0,0,8,1,0,6,0,2,9,0,0,0,0,9,0,0,0,4,0,0,0,0,0,8,0,7,0];
				case "level_482":
					return [9,0,1,4,8,0,2,0,0,0,0,0,0,0,6,0,4,0,0,0,0,1,7,3,0,0,0,2,3,0,0,0,0,0,9,0,0,0,5,0,6,0,1,0,0,0,4,0,0,0,0,0,7,8,0,0,0,9,3,7,0,0,0,0,8,0,6,0,0,0,0,0,0,0,9,0,1,8,3,0,2];
				case "level_483":
					return [9,0,2,0,7,0,0,0,1,0,0,0,6,0,0,0,0,0,8,0,3,1,9,0,0,0,0,0,8,0,0,0,0,4,0,0,7,0,5,4,1,6,8,0,3,0,0,4,0,0,0,0,2,0,0,0,0,0,6,4,5,0,2,0,0,0,0,0,3,0,0,0,2,0,0,0,8,0,7,0,6];
				case "level_484":
					return [7,0,0,8,0,9,4,0,6,0,1,9,0,7,0,0,0,0,0,5,0,6,0,0,3,0,0,0,0,0,0,0,3,6,0,4,0,0,8,0,0,0,9,0,0,5,0,1,9,0,0,0,0,0,0,0,5,0,0,6,0,4,0,0,0,0,0,3,0,1,9,0,3,0,7,1,0,2,0,0,5];
				case "level_485":
					return [0,0,0,5,0,0,0,0,2,0,5,2,0,0,0,4,0,0,0,4,3,0,7,0,0,9,5,0,0,0,2,0,7,0,0,4,0,6,0,0,0,0,0,2,0,3,0,0,8,0,5,0,0,0,7,9,0,0,1,0,2,5,0,0,0,6,0,0,0,1,7,0,1,0,0,0,0,6,0,0,0];
				case "level_486":
					return [0,0,0,0,0,1,0,0,0,0,0,0,0,6,7,1,2,9,0,0,0,0,0,0,0,5,4,0,1,0,0,0,6,5,9,0,6,5,0,7,4,8,0,1,2,0,7,2,1,0,0,0,8,0,4,9,0,0,0,0,0,0,0,1,6,7,2,8,0,0,0,0,0,0,0,6,0,0,0,0,0];
				case "level_487":
					return [0,0,0,0,7,8,0,0,5,0,2,0,9,1,0,7,0,0,0,0,7,0,0,3,4,0,0,7,0,0,0,0,0,0,0,4,2,8,0,0,0,0,0,6,3,4,0,0,0,0,0,0,0,9,0,0,9,8,0,0,5,0,0,0,0,4,0,5,6,0,9,0,3,0,0,1,4,0,0,0,0];
				case "level_488":
					return [3,7,6,0,8,0,0,4,0,0,8,0,0,0,0,0,0,0,9,0,0,1,0,6,0,0,8,6,0,0,0,9,0,3,0,0,4,5,0,2,0,7,0,8,9,0,0,7,0,5,0,0,0,4,7,0,0,4,0,9,0,0,3,0,0,0,0,0,0,0,9,0,0,3,0,0,1,0,4,2,6];
				case "level_489":
					return [2,0,0,0,7,5,0,1,8,5,1,0,6,0,0,0,0,0,0,0,4,3,0,0,0,0,0,0,0,9,0,5,0,0,0,6,0,0,8,0,6,0,9,0,0,7,0,0,0,2,0,3,0,0,0,0,0,0,0,7,8,0,0,0,0,0,0,0,6,0,4,3,4,3,0,5,8,0,0,0,7];
				case "level_490":
					return [0,3,0,4,6,0,0,0,0,0,0,7,0,0,3,0,0,9,0,0,1,0,0,9,8,6,0,2,0,0,9,0,0,4,0,0,5,0,4,0,0,0,1,0,8,0,0,6,0,0,4,0,0,7,0,2,3,5,0,0,6,0,0,1,0,0,3,0,0,5,0,0,0,0,0,0,9,1,0,8,0];
				case "level_491":
					return [6,0,0,2,0,0,0,0,0,0,4,1,8,0,0,0,0,0,0,3,0,0,9,4,1,7,0,5,0,0,0,4,0,0,8,0,7,0,0,0,8,0,0,0,5,0,9,0,0,3,0,0,0,2,0,6,2,4,7,0,0,9,0,0,0,0,0,0,8,6,2,0,0,0,0,0,0,9,0,0,7];
				case "level_492":
					return [7,1,0,0,0,2,0,5,0,0,0,0,7,5,0,0,0,1,0,0,4,1,0,0,2,0,0,0,0,6,0,3,9,0,1,0,4,3,0,0,0,0,0,6,2,0,7,0,2,6,0,8,0,0,0,0,2,0,0,5,1,0,0,9,0,0,0,7,8,0,0,0,0,6,0,4,0,0,0,9,8];
				case "level_493":
					return [0,0,0,4,9,8,0,0,0,0,2,0,0,1,3,0,8,7,0,0,3,5,0,0,0,0,0,0,0,7,0,0,0,4,0,2,0,8,0,0,5,0,0,6,0,1,0,9,0,0,0,3,0,0,0,0,0,0,0,5,1,0,0,2,4,0,1,8,0,0,7,0,0,0,0,9,4,7,0,0,0];
				case "level_494":
					return [0,7,0,5,3,0,0,0,0,1,0,0,6,7,0,2,0,0,3,9,0,0,0,0,7,0,0,0,0,0,0,0,0,8,6,1,0,1,0,0,0,0,0,9,0,5,6,8,0,0,0,0,0,0,0,0,1,0,0,0,0,2,6,0,0,7,0,6,3,0,0,4,0,0,0,0,9,1,0,3,0];
				case "level_495":
					return [0,9,0,1,0,0,0,0,4,5,0,0,4,0,3,0,9,0,4,0,0,7,0,6,1,3,0,0,3,0,0,2,4,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,9,3,0,0,8,0,0,5,4,2,0,9,0,0,6,0,6,0,3,0,7,0,0,8,1,0,0,0,0,5,0,4,0];
				case "level_496":
					return [0,0,3,0,9,0,4,0,0,0,0,0,6,0,0,0,0,1,0,8,0,4,0,0,5,3,0,0,0,0,1,0,6,0,9,8,0,2,0,0,3,0,0,4,0,1,9,0,2,0,4,0,0,0,0,3,8,0,0,7,0,1,0,4,0,0,0,0,5,0,0,0,0,0,5,0,6,0,8,0,0];
				case "level_497":
					return [1,0,0,0,0,0,0,0,0,0,0,0,2,3,0,0,5,9,0,0,0,8,0,0,2,0,7,4,0,0,0,9,0,0,1,3,0,0,1,5,0,4,7,0,0,5,9,0,0,1,0,0,0,8,7,0,9,0,0,5,0,0,0,3,8,0,0,4,7,0,0,0,0,0,0,0,0,0,0,0,1];
				case "level_498":
					return [0,6,0,1,7,0,0,0,0,2,0,0,0,0,0,4,0,0,1,0,8,0,0,9,6,0,0,9,8,0,0,0,0,5,0,0,0,0,6,3,9,5,8,0,0,0,0,5,0,0,0,0,1,9,0,0,2,8,0,0,3,0,5,0,0,1,0,0,0,0,0,4,0,0,0,0,6,7,0,2,0];
				case "level_499":
					return [8,7,0,0,0,0,0,0,0,0,0,6,0,0,7,2,0,0,5,0,0,0,3,8,6,7,0,0,1,3,0,0,5,8,0,0,6,0,0,0,0,0,0,0,2,0,0,5,2,0,0,9,1,0,0,2,4,1,5,0,0,0,8,0,0,1,4,0,0,7,0,0,0,0,0,0,0,0,0,4,5];
				case "level_500":
					return [0,3,2,7,0,0,6,0,9,0,0,0,0,1,0,2,0,0,0,4,0,6,0,0,8,0,0,0,0,0,4,0,0,7,0,8,0,2,0,9,8,5,0,3,0,8,0,4,0,0,7,0,0,0,0,0,8,0,0,1,0,4,0,0,0,9,0,5,0,0,0,0,5,0,3,0,0,4,1,8,0];
				case "level_501":
					return [8,0,2,0,0,0,4,0,0,0,5,0,3,0,8,0,0,0,0,4,0,0,0,7,8,0,0,3,0,0,7,0,4,0,0,0,1,0,0,2,0,3,0,0,9,0,0,0,5,0,9,0,0,7,0,0,7,4,0,0,0,8,0,0,0,0,9,0,6,0,2,0,0,0,6,0,0,0,1,0,4];
				case "level_502":
					return [0,0,0,5,0,0,8,0,9,0,0,0,2,6,9,1,0,0,0,0,0,0,0,0,0,0,4,0,0,4,0,0,0,3,0,1,2,0,0,0,3,0,0,0,7,8,0,5,0,0,0,2,0,0,4,0,0,0,0,0,0,0,0,0,0,2,8,7,5,0,0,0,5,0,9,0,0,6,0,0,0];
				case "level_503":
					return [6,0,0,0,8,0,4,0,0,0,4,0,0,0,0,0,5,1,0,0,0,0,1,0,0,3,0,3,0,0,0,0,8,0,0,0,1,0,9,0,2,0,6,0,8,0,0,0,7,0,0,0,0,3,0,5,0,0,4,0,0,0,0,9,2,0,0,0,0,0,7,0,0,0,7,0,5,0,0,0,9];
				case "level_504":
					return [0,5,0,0,9,0,0,0,0,0,0,0,0,0,6,3,9,0,6,0,0,4,3,0,0,0,8,1,0,0,2,0,0,6,3,0,0,0,8,0,0,0,5,0,0,0,3,6,0,0,5,0,0,7,5,0,0,0,8,4,0,0,6,0,8,9,6,0,0,0,0,0,0,0,0,0,7,0,0,1,0];
				case "level_505":
					return [3,5,0,0,0,0,0,0,2,0,0,1,0,7,0,0,0,0,4,0,0,0,8,5,9,0,0,0,0,0,8,0,0,0,0,0,0,4,8,0,6,0,3,1,0,0,0,0,0,0,2,0,0,0,0,0,7,5,4,0,0,0,9,0,0,0,0,9,0,2,0,0,1,0,0,0,0,0,0,3,6];
				case "level_506":
					return [0,3,0,0,0,7,4,6,0,0,5,0,0,3,0,9,0,0,0,0,0,0,0,8,0,0,0,0,9,0,0,0,0,5,0,0,5,4,0,6,0,9,0,2,1,0,0,2,0,0,0,0,3,0,0,0,0,4,0,0,0,0,0,0,0,7,0,2,0,0,1,0,0,2,6,7,0,0,0,8,0];
				case "level_507":
					return [0,0,1,7,5,0,0,0,0,0,0,0,0,0,0,0,0,0,3,4,0,0,0,0,0,9,6,9,0,3,0,2,0,0,6,0,0,0,5,0,7,0,9,0,0,0,8,0,0,9,0,1,0,2,1,9,0,0,0,0,0,3,4,0,0,0,0,0,0,0,0,0,0,0,0,0,1,4,7,0,0];
				case "level_508":
					return [0,7,0,0,8,0,0,0,6,0,0,6,0,0,0,1,7,0,0,0,0,0,3,0,8,0,0,0,9,0,0,0,6,0,0,0,2,4,0,0,1,0,0,5,7,0,0,0,4,0,0,0,9,0,0,0,9,0,5,0,0,0,0,0,5,8,0,0,0,3,0,0,3,0,0,0,4,0,0,2,0];
				case "level_509":
					return [4,0,0,0,0,3,0,9,2,6,0,0,0,2,0,0,3,0,0,0,0,0,0,1,0,0,0,5,0,0,0,0,0,0,2,0,2,0,6,7,0,9,8,0,1,0,8,0,0,0,0,0,0,7,0,0,0,4,0,0,0,0,0,0,7,0,0,5,0,0,0,8,9,1,0,3,0,0,0,0,5];
				case "level_510":
					return [0,0,0,0,0,4,0,5,0,8,0,0,7,0,0,1,2,0,0,0,6,0,2,0,0,0,7,0,7,0,0,4,0,0,0,0,4,0,3,8,0,9,6,0,2,0,0,0,0,7,0,0,3,0,5,0,0,0,1,0,2,0,0,0,9,1,0,0,8,0,0,5,0,3,0,4,0,0,0,0,0];
				case "level_511":
					return [0,0,0,0,2,9,0,8,0,4,0,0,1,0,0,0,0,3,8,0,0,0,0,4,0,0,9,0,0,0,0,0,0,0,6,0,0,8,0,4,6,7,0,2,0,0,3,0,0,0,0,0,0,0,3,0,0,7,0,0,0,0,5,9,0,0,0,0,5,0,0,4,0,6,0,8,4,0,0,0,0];
				case "level_512":
					return [0,0,0,0,0,6,0,0,0,0,0,2,0,8,0,0,0,1,0,0,8,0,0,4,7,0,9,0,0,1,0,0,0,0,0,2,0,2,9,7,0,1,3,5,0,3,0,0,0,0,0,8,0,0,7,0,3,4,0,0,6,0,0,4,0,0,0,3,0,5,0,0,0,0,0,9,0,0,0,0,0];
				case "level_513":
					return [0,0,0,0,7,0,1,0,9,0,4,0,0,0,8,0,2,0,0,0,0,0,0,5,4,0,0,4,0,0,0,0,0,6,0,1,9,0,0,4,0,1,0,0,5,1,0,8,0,0,0,0,0,2,0,0,4,7,0,0,0,0,0,0,3,0,2,0,0,0,7,0,7,0,2,0,1,0,0,0,0];
				case "level_514":
					return [0,0,7,0,0,3,6,0,0,4,0,0,6,8,0,0,0,0,1,0,0,4,0,0,0,5,0,6,0,0,0,0,8,2,0,0,0,1,4,0,0,0,7,3,0,0,0,2,9,0,0,0,0,6,0,8,0,0,0,4,0,0,7,0,0,0,0,7,6,0,0,1,0,0,6,5,0,0,8,0,0];
				case "level_515":
					return [6,0,0,0,7,4,3,0,0,0,0,0,3,0,0,0,0,8,0,0,0,0,8,0,9,4,0,0,1,2,0,4,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,1,0,4,5,0,0,4,3,0,9,0,0,0,0,2,0,0,0,0,1,0,0,0,0,0,1,4,5,0,0,0,2];
				case "level_516":
					return [0,0,0,0,9,0,0,3,2,0,0,0,1,0,0,0,6,8,0,3,0,0,0,0,0,0,4,0,0,2,0,5,6,0,0,0,0,1,6,4,0,7,2,8,0,0,0,0,2,1,0,9,0,0,6,0,0,0,0,0,0,2,0,7,4,0,0,0,2,0,0,0,1,2,0,0,7,0,0,0,0];
				case "level_517":
					return [9,0,0,6,0,0,5,0,0,0,0,0,0,0,7,0,6,0,8,0,5,3,0,0,0,0,7,0,9,0,0,0,0,0,8,6,0,0,2,0,0,0,7,0,0,1,5,0,0,0,0,0,9,0,3,0,0,0,0,6,4,0,2,0,7,0,5,0,0,0,0,0,0,0,1,0,0,9,0,0,3];
				case "level_518":
					return [2,0,8,5,0,0,7,0,0,0,7,0,0,0,0,0,6,0,3,0,0,7,9,0,0,0,2,0,0,1,0,2,9,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,8,4,0,1,0,0,8,0,0,0,5,6,0,0,3,0,4,0,0,0,0,0,2,0,0,0,3,0,0,2,6,0,1];
				case "level_519":
					return [0,0,0,0,4,0,1,0,0,0,0,0,0,0,8,5,3,0,2,0,5,0,9,0,0,8,0,1,0,9,0,3,4,0,0,0,0,4,0,0,0,0,0,2,0,0,0,0,1,6,0,9,0,7,0,9,0,0,7,0,4,0,3,0,8,1,4,0,0,0,0,0,0,0,4,0,1,0,0,0,0];
				case "level_520":
					return [0,9,0,0,8,0,0,0,7,0,0,7,0,0,3,0,8,2,0,0,5,0,0,6,0,0,0,4,0,0,0,0,2,0,1,0,0,7,6,0,0,0,2,9,0,0,8,0,6,0,0,0,0,5,0,0,0,9,0,0,1,0,0,9,4,0,3,0,0,8,0,0,2,0,0,0,1,0,0,7,0];
				case "level_521":
					return [0,0,1,0,3,0,0,9,0,6,3,0,0,0,4,0,0,0,5,0,0,0,0,0,0,1,0,0,0,0,0,4,0,7,8,0,3,0,0,8,6,5,0,0,9,0,8,2,0,7,0,0,0,0,0,6,0,0,0,0,0,0,8,0,0,0,1,0,0,0,2,4,0,2,0,0,8,0,5,0,0];
				case "level_522":
					return [8,0,0,0,4,0,0,6,0,0,0,4,0,0,0,0,3,0,0,6,9,0,0,1,0,0,0,0,0,0,0,5,0,0,4,6,0,0,7,8,3,4,2,0,0,5,4,0,0,9,0,0,0,0,0,0,0,9,0,0,3,2,0,0,1,0,0,0,0,8,0,0,0,7,0,0,2,0,0,0,1];
				case "level_523":
					return [5,0,0,3,8,0,0,0,0,0,7,0,0,0,9,0,3,0,8,0,0,2,0,0,7,0,0,3,0,0,0,0,1,0,6,0,0,8,4,0,0,0,5,2,0,0,6,0,7,0,0,0,0,3,0,0,9,0,0,2,0,0,5,0,3,0,4,0,0,0,8,0,0,0,0,0,7,3,0,0,2];
				case "level_524":
					return [0,2,0,3,4,0,0,9,0,0,0,0,0,0,2,4,0,6,0,0,7,0,8,0,0,0,0,0,8,0,9,0,0,1,0,2,9,0,0,0,0,0,0,0,4,2,0,1,0,0,5,0,7,0,0,0,0,0,6,0,9,0,0,1,0,6,2,0,0,0,0,0,0,4,0,0,1,3,0,2,0];
				case "level_525":
					return [0,0,3,5,0,0,6,0,0,6,0,0,0,0,8,0,0,0,4,0,0,3,0,0,5,7,0,0,0,0,0,0,3,0,1,0,7,0,6,0,4,0,3,0,2,0,1,0,6,0,0,0,0,0,0,6,8,0,0,4,0,0,9,0,0,0,8,0,0,0,0,5,0,0,4,0,0,7,2,0,0];
				case "level_526":
					return [0,0,0,6,0,0,0,7,5,0,0,4,0,2,0,1,0,0,0,0,0,0,0,0,9,3,0,4,0,0,1,0,8,7,0,0,0,1,0,0,0,0,0,4,0,0,0,2,3,0,9,0,0,8,0,6,8,0,0,0,0,0,0,0,0,9,0,8,0,6,0,0,2,3,0,0,0,6,0,0,0];
				case "level_527":
					return [0,0,0,4,0,0,0,9,0,8,0,0,0,0,0,7,0,0,0,0,0,7,0,2,0,3,4,0,0,3,0,0,0,0,0,9,2,1,0,9,0,4,0,5,6,9,0,0,0,0,0,4,0,0,3,5,0,1,0,9,0,0,0,0,0,1,0,0,0,0,0,7,0,9,0,0,0,6,0,0,0];
				case "level_528":
					return [1,0,4,3,0,0,0,0,0,0,0,2,0,7,0,0,0,0,3,0,0,0,5,0,4,6,0,0,0,0,7,1,0,5,2,0,6,0,0,0,0,0,0,0,7,0,9,5,0,8,2,0,0,0,0,1,7,0,9,0,0,0,5,0,0,0,0,2,0,7,0,0,0,0,0,0,0,7,2,0,3];
				case "level_529":
					return [0,2,0,1,0,0,0,0,5,9,0,8,3,0,0,0,0,0,0,0,0,0,7,5,0,2,0,0,4,0,0,0,0,0,9,8,0,0,6,0,3,0,1,0,0,2,8,0,0,0,0,0,3,0,0,3,0,4,5,0,0,0,0,0,0,0,0,0,3,2,0,7,5,0,0,0,0,6,0,1,0];
				case "level_530":
					return [5,0,0,6,0,8,0,1,0,1,4,0,9,0,0,0,0,0,0,0,2,0,1,0,6,0,0,0,1,0,4,8,0,0,0,0,0,8,0,0,0,0,0,6,0,0,0,0,0,3,6,0,8,0,0,0,1,0,5,0,7,0,0,0,0,0,0,0,9,0,4,2,0,6,0,3,0,7,0,0,9];
				case "level_531":
					return [4,0,0,0,0,0,0,0,9,0,0,8,4,6,0,2,0,0,0,7,2,5,0,0,0,4,0,0,3,0,0,2,6,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,7,1,0,0,3,0,0,8,0,0,0,2,3,9,0,0,0,7,0,5,9,8,0,0,1,0,0,0,0,0,0,0,2];
				case "level_532":
					return [7,4,0,0,0,8,9,3,0,0,1,0,0,4,0,6,0,0,0,5,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,3,4,0,0,8,0,5,0,0,6,9,0,0,0,0,0,7,0,0,0,0,0,7,0,0,0,6,0,0,0,8,0,5,0,0,1,0,0,9,7,3,0,0,0,2,8];
				case "level_533":
					return [6,0,0,0,1,0,0,4,0,0,5,0,0,7,4,0,0,0,0,0,3,0,0,0,0,0,2,8,0,9,0,0,1,0,7,0,3,4,0,0,0,0,0,9,8,0,7,0,8,0,0,5,0,4,5,0,0,0,0,0,8,0,0,0,0,0,4,2,0,0,5,0,0,3,0,0,8,0,0,0,6];
				case "level_534":
					return [5,0,0,0,0,4,0,0,7,0,0,0,0,2,0,1,3,0,0,0,0,0,0,6,5,0,0,0,5,0,0,0,0,8,1,0,0,3,0,5,0,1,0,6,0,0,1,4,0,0,0,0,7,0,0,0,5,2,0,0,0,0,0,0,2,7,0,1,0,0,0,0,9,0,0,7,0,0,0,0,2];
				case "level_535":
					return [0,0,0,0,9,4,0,6,0,0,9,0,8,0,0,0,0,5,2,6,0,0,0,0,0,7,8,0,2,0,0,0,0,8,0,0,7,0,0,0,4,0,0,0,6,0,0,5,0,0,0,0,2,0,8,7,0,0,0,0,0,1,3,5,0,0,0,0,6,0,8,0,0,3,0,5,1,0,0,0,0];
				case "level_536":
					return [0,0,0,0,0,1,6,9,0,1,0,0,4,7,0,0,0,0,0,0,0,0,8,6,0,0,7,0,0,9,0,0,0,0,7,0,6,5,0,0,1,0,0,4,9,0,3,0,0,0,0,1,0,0,5,0,0,1,4,0,0,0,0,0,0,0,0,6,7,0,0,3,0,4,7,2,0,0,0,0,0];
				case "level_537":
					return [0,0,0,0,0,4,0,0,5,0,9,0,0,1,8,0,0,0,0,0,4,0,2,0,3,0,7,1,0,0,0,0,2,0,0,0,0,5,8,0,3,0,7,2,0,0,0,0,8,0,0,0,0,4,6,0,9,0,4,0,8,0,0,0,0,0,2,7,0,0,9,0,3,0,0,6,0,0,0,0,0];
				case "level_538":
					return [8,0,0,0,1,0,3,0,0,0,0,4,0,0,0,0,6,0,0,0,0,8,2,0,0,0,5,2,0,0,1,0,0,9,7,0,7,0,9,0,0,0,6,0,8,0,5,8,0,0,9,0,0,2,5,0,0,0,4,8,0,0,0,0,9,0,0,0,0,5,0,0,0,0,3,0,9,0,0,0,6];
				case "level_539":
					return [0,0,0,0,0,0,0,0,0,0,0,0,0,9,6,0,0,8,0,4,7,0,0,0,5,3,0,0,0,4,0,1,0,0,7,3,7,0,0,0,6,0,0,0,9,8,1,0,0,7,0,2,0,0,0,5,3,0,0,0,7,8,0,6,0,0,5,8,0,0,0,0,0,0,0,0,0,0,0,0,0];
				case "level_540":
					return [0,0,0,0,0,0,0,0,0,9,0,0,2,5,0,4,7,0,0,6,0,0,0,4,3,0,0,0,0,3,0,0,0,5,8,0,4,0,0,9,2,8,0,0,1,0,7,8,0,0,0,6,0,0,0,0,9,1,0,0,0,4,0,0,8,4,0,9,3,0,0,6,0,0,0,0,0,0,0,0,0];
				case "level_541":
					return [3,0,5,0,2,0,0,0,1,0,0,4,0,9,0,0,6,0,0,0,0,7,0,0,0,0,0,8,2,0,0,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,0,0,9,5,0,0,0,0,0,5,0,0,0,0,1,0,0,7,0,3,0,0,9,0,0,0,8,0,2,0,6];
				case "level_542":
					return [0,8,1,0,2,0,0,0,7,9,5,2,0,0,0,0,0,0,0,0,0,0,9,1,0,0,0,0,0,0,1,8,0,0,2,0,0,0,5,2,0,6,4,0,0,0,1,0,0,5,9,0,0,0,0,0,0,4,1,0,0,0,0,0,0,0,0,0,0,1,3,8,1,0,0,0,3,0,7,9,0];
				case "level_543":
					return [4,0,3,9,0,0,8,0,0,5,1,0,0,6,0,0,0,0,0,9,0,0,0,8,0,0,0,0,0,0,1,0,6,0,5,0,0,0,4,0,0,0,9,0,0,0,5,0,3,0,4,0,0,0,0,0,0,4,0,0,0,7,0,0,0,0,0,8,0,0,2,1,0,0,5,0,0,2,6,0,3];
				case "level_544":
					return [2,0,9,0,0,0,0,0,7,0,3,0,1,0,9,0,0,0,0,7,0,0,0,8,0,0,9,0,0,1,8,0,7,0,0,0,0,0,4,2,0,1,5,0,0,0,0,0,3,0,5,8,0,0,8,0,0,7,0,0,0,9,0,0,0,0,5,0,6,0,2,0,6,0,0,0,0,0,7,0,4];
				case "level_545":
					return [0,0,0,9,0,4,1,0,5,0,0,5,0,1,0,0,0,0,8,0,0,0,0,3,4,0,0,0,0,2,0,5,0,0,0,7,0,0,6,0,2,0,5,0,0,1,0,0,0,4,0,9,0,0,0,0,3,4,0,0,0,0,1,0,0,0,0,7,0,8,0,0,9,0,1,6,0,8,0,0,0];
				case "level_546":
					return [9,0,0,1,0,5,0,0,0,0,0,7,9,0,0,3,4,0,0,2,0,0,7,0,6,0,0,7,0,0,0,0,0,9,5,0,0,0,0,0,0,0,0,0,0,0,9,4,0,0,0,0,0,2,0,0,2,0,3,0,0,8,0,0,5,1,0,0,8,4,0,0,0,0,0,5,0,2,0,0,7];
				case "level_547":
					return [6,0,0,0,0,8,0,0,9,0,9,0,0,0,0,0,6,7,0,0,4,0,0,0,2,0,0,0,0,0,9,0,0,0,2,3,0,3,0,4,6,7,0,1,0,7,5,0,0,0,1,0,0,0,0,0,7,0,0,0,5,0,0,8,6,0,0,0,0,0,7,0,5,0,0,8,0,0,0,0,2];
				case "level_548":
					return [0,4,0,0,0,0,5,0,1,0,3,0,0,0,9,0,0,6,8,0,0,2,5,6,0,0,0,0,0,0,0,0,1,0,0,2,4,8,0,0,0,0,0,3,7,6,0,0,8,0,0,0,0,0,0,0,0,6,8,4,0,0,5,7,0,0,3,0,0,0,4,0,5,0,4,0,0,0,0,6,0];
				case "level_549":
					return [0,0,0,4,0,0,0,2,1,0,0,4,0,9,0,6,0,0,0,0,0,0,0,0,9,0,4,0,9,0,6,0,1,2,0,0,5,0,0,0,0,0,0,0,7,0,0,3,9,0,7,0,5,0,1,0,6,0,0,0,0,0,0,0,0,7,0,2,0,5,0,0,3,8,0,0,0,4,0,0,0];
				case "level_550":
					return [0,3,0,0,8,0,6,0,0,0,2,0,6,1,0,0,0,0,0,0,0,5,0,0,1,8,0,4,0,0,0,0,5,0,0,1,0,5,0,0,4,0,0,9,0,8,0,0,2,0,0,0,0,4,0,7,9,0,0,8,0,0,0,0,0,0,0,9,7,0,4,0,0,0,4,0,2,0,0,3,0];
				case "level_551":
					return [0,0,0,0,6,0,0,1,8,0,8,0,9,0,0,0,0,0,0,5,1,0,8,0,2,0,0,5,0,0,8,0,0,3,2,0,0,0,0,0,1,0,0,0,0,0,1,6,0,0,2,0,0,5,0,0,4,0,2,0,8,3,0,0,0,0,0,0,9,0,6,0,3,7,0,0,4,0,0,0,0];
				case "level_552":
					return [0,0,6,0,0,0,5,9,0,0,4,0,0,0,9,0,2,0,2,0,0,0,0,0,0,0,6,0,0,0,1,0,0,2,6,0,0,0,1,6,5,7,8,0,0,0,8,4,0,0,3,0,0,0,4,0,0,0,0,0,0,0,7,0,3,0,9,0,0,0,5,0,0,6,5,0,0,0,3,0,0];
				case "level_553":
					return [6,0,0,7,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,4,0,0,0,8,2,0,2,3,0,0,8,0,9,0,0,8,0,0,0,6,0,0,0,5,0,0,1,0,3,0,0,8,4,0,1,8,0,0,0,7,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,6,0,0,2];
				case "level_554":
					return [0,0,0,3,0,0,0,9,8,2,0,0,0,0,0,0,7,0,8,0,0,0,7,0,6,0,0,7,0,8,0,5,0,0,0,0,0,4,0,7,2,6,0,1,0,0,0,0,0,9,0,5,0,7,0,0,3,0,4,0,0,0,1,0,6,0,0,0,0,0,0,3,4,2,0,0,0,9,0,0,0];
				case "level_555":
					return [0,0,5,0,3,0,9,4,0,2,0,0,0,1,4,0,0,0,0,0,0,0,0,6,0,8,0,0,9,2,0,0,0,0,0,4,0,8,0,0,9,0,0,3,0,1,0,0,0,0,0,7,6,0,0,5,0,1,0,0,0,0,0,0,0,0,8,4,0,0,0,7,0,2,4,0,7,0,1,0,0];
				case "level_556":
					return [5,0,1,0,9,0,0,0,0,0,0,0,0,0,7,0,0,1,0,4,0,0,1,0,0,5,6,4,3,0,0,0,1,6,0,0,0,0,0,0,5,0,0,0,0,0,0,6,4,0,0,0,9,5,3,1,0,0,4,0,0,8,0,9,0,0,7,0,0,0,0,0,0,0,0,0,8,0,3,0,2];
				case "level_557":
					return [0,0,0,0,3,0,0,0,0,1,2,0,9,0,0,0,0,0,0,8,0,0,5,4,0,6,3,0,7,6,0,1,0,0,0,0,4,0,0,0,0,0,0,0,5,0,0,0,0,8,0,2,7,0,9,4,0,1,2,0,0,5,0,0,0,0,0,0,5,0,8,7,0,0,0,0,9,0,0,0,0];
				case "level_558":
					return [0,0,9,5,0,0,3,0,0,0,6,7,0,1,0,0,0,0,0,0,0,8,0,6,0,9,0,5,0,0,0,0,0,0,0,0,0,4,2,0,0,0,7,8,0,0,0,0,0,0,0,0,0,4,0,3,0,9,0,7,0,0,0,0,0,0,0,6,0,5,1,0,0,0,8,0,0,2,6,0,0];
				case "level_559":
					return [7,0,1,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,2,6,0,7,0,1,0,0,0,0,5,0,0,0,0,0,6,7,0,8,0,0,9,0,0,3,0,3,7,0,0,0,0,0,2,0,0,0,0,6,0,9,0,4,5,0,0,0,0,0,0,0,0,0,0,0,0,0,8,4,1,0,2];
				case "level_560":
					return [0,0,0,2,0,0,5,0,4,1,9,4,8,0,0,3,0,0,0,0,0,0,0,0,0,1,0,0,0,0,7,8,0,0,9,0,0,0,6,0,2,0,4,0,0,0,8,0,0,6,5,0,0,0,0,6,0,0,0,0,0,0,0,0,0,1,0,0,9,8,7,2,7,0,3,0,0,8,0,0,0];
				case "level_561":
					return [8,0,0,0,5,0,0,0,0,0,0,5,1,0,3,0,8,0,7,0,0,0,0,2,4,0,0,1,0,9,0,0,0,0,4,0,0,4,0,0,1,0,0,7,0,0,6,0,0,0,0,5,0,1,0,0,4,8,0,0,0,0,3,0,1,0,2,0,6,8,0,0,0,0,0,0,9,0,0,0,2];
				case "level_562":
					return [0,0,0,8,0,0,0,4,1,1,0,0,0,9,5,0,0,0,9,8,3,0,0,0,0,0,5,0,0,0,0,4,0,1,0,7,0,9,0,0,0,0,0,3,0,4,0,8,0,3,0,0,0,0,7,0,0,0,0,0,6,8,2,0,0,0,7,6,0,0,0,4,5,6,0,0,0,1,0,0,0];
				case "level_563":
					return [8,0,0,2,0,9,0,4,0,5,6,0,8,0,0,0,0,0,0,0,2,0,1,0,3,0,0,0,7,0,4,9,0,0,0,0,0,4,0,0,0,0,0,7,0,0,0,0,0,7,6,0,3,0,0,0,4,0,3,0,5,0,0,0,0,0,0,0,8,0,6,3,0,3,0,7,0,4,0,0,1];
				case "level_564":
					return [0,8,0,0,7,0,2,0,0,0,0,4,0,0,0,0,0,3,0,0,0,8,9,0,0,6,0,0,9,0,7,0,0,1,0,5,0,5,1,0,0,0,3,8,0,6,0,8,0,0,1,0,9,0,0,6,0,0,4,8,0,0,0,1,0,0,0,0,0,6,0,0,0,0,2,0,1,0,0,3,0];
				case "level_565":
					return [0,0,3,0,7,0,0,0,5,0,0,2,5,6,0,0,0,0,0,0,0,4,0,0,7,0,6,0,8,0,0,0,4,0,6,0,0,0,4,0,8,0,9,0,0,0,7,0,2,0,0,0,8,0,9,0,1,0,0,7,0,0,0,0,0,0,0,9,1,8,0,0,8,0,0,0,2,0,3,0,0];
				case "level_566":
					return [0,0,8,0,0,7,0,3,0,2,0,0,9,0,0,0,0,1,0,0,0,0,4,2,0,7,0,5,0,0,4,0,0,0,2,0,1,0,9,0,0,0,3,0,7,0,2,0,0,0,6,0,0,5,0,3,0,2,1,0,0,0,0,4,0,0,0,0,8,0,0,2,0,1,0,7,0,0,4,0,0];
				case "level_567":
					return [0,1,0,0,4,6,3,0,7,2,0,7,0,9,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,7,5,0,8,0,0,0,0,0,1,0,9,7,0,8,0,0,0,6,0,0,0,2,0,0,0,0,0,0,0,0,0,0,8,0,2,0,9,4,0,1,7,2,0,0,8,0];
				case "level_568":
					return [0,5,0,0,0,0,8,9,0,0,4,0,1,2,0,0,0,0,7,0,3,0,0,0,0,0,0,1,0,0,8,5,7,3,0,6,0,0,0,0,0,0,0,0,0,4,0,8,3,1,6,0,0,9,0,0,0,0,0,0,4,0,5,0,0,0,0,6,8,0,3,0,0,3,4,0,0,0,0,2,0];
				case "level_569":
					return [0,0,0,0,0,0,0,5,0,0,0,0,7,0,0,0,1,8,0,0,0,1,6,3,0,0,9,9,0,0,0,0,0,0,3,1,0,6,0,0,2,0,0,9,0,2,4,0,0,0,0,0,0,5,4,0,0,8,7,9,0,0,0,3,8,0,0,0,1,0,0,0,0,5,0,0,0,0,0,0,0];
				case "level_570":
					return [0,0,0,0,0,0,0,0,0,0,0,0,4,0,9,0,8,1,0,0,0,0,1,3,4,9,0,1,9,0,0,0,0,0,0,3,6,0,0,0,5,0,0,0,7,8,0,0,0,0,0,0,6,9,0,8,4,2,7,0,0,0,0,2,3,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0];
				case "level_571":
					return [0,2,0,0,0,7,0,0,0,7,0,0,6,8,0,0,2,0,3,0,6,0,4,0,0,0,0,5,0,0,0,7,0,8,0,6,0,0,0,0,0,0,0,0,0,2,0,7,0,6,0,0,0,1,0,0,0,0,1,0,6,0,4,0,9,0,0,5,6,0,0,3,0,0,0,3,0,0,0,1,0];
				case "level_572":
					return [0,4,1,0,0,0,5,6,0,0,7,0,0,0,2,4,0,0,0,0,6,7,5,0,0,0,0,7,0,0,0,0,0,3,0,0,0,1,0,0,9,0,0,2,0,0,0,3,0,0,0,0,0,4,0,0,0,0,8,9,2,0,0,0,0,8,4,0,0,0,7,0,0,3,2,0,0,0,1,4,0];
				case "level_573":
					return [0,0,4,0,0,8,1,0,0,0,0,0,9,0,0,0,0,4,0,6,8,0,0,1,0,0,2,0,3,0,1,0,0,0,0,0,7,0,1,0,2,0,4,0,6,0,0,0,0,0,4,0,3,0,5,0,0,2,0,0,9,4,0,8,0,0,0,0,9,0,0,0,0,0,7,6,0,0,2,0,0];
				case "level_574":
					return [5,0,0,0,7,4,0,1,0,0,0,0,0,3,0,4,9,0,0,0,0,1,0,0,0,0,3,0,2,8,0,4,0,0,3,0,0,0,0,0,0,0,0,0,0,0,7,0,0,8,0,6,4,0,2,0,0,0,0,8,0,0,0,0,1,4,0,9,0,0,0,0,0,8,0,4,6,0,0,0,2];
				case "level_575":
					return [0,3,0,0,0,7,4,0,1,8,1,0,0,3,0,0,0,0,0,0,6,0,0,4,0,0,0,0,0,0,0,7,0,0,6,0,0,0,3,5,1,9,7,0,0,0,5,0,0,8,0,0,0,0,0,0,0,9,0,0,8,0,0,0,0,0,0,2,0,0,5,7,6,0,2,7,0,0,0,4,0];
				case "level_576":
					return [0,7,9,0,0,1,0,0,0,6,0,0,0,0,0,0,0,0,0,0,4,0,0,3,7,6,2,2,0,0,0,3,8,0,0,0,0,0,7,0,1,0,5,0,0,0,0,0,9,5,0,0,0,3,8,1,3,2,0,0,6,0,0,0,0,0,0,0,0,0,0,5,0,0,0,3,0,0,4,8,0];
				case "level_577":
					return [0,7,0,0,0,3,8,0,0,0,0,0,0,8,4,1,0,0,4,0,0,2,0,0,0,0,7,9,0,0,6,0,0,4,0,0,3,1,0,0,0,0,0,5,8,0,0,4,0,0,7,0,0,9,8,0,0,0,0,5,0,0,4,0,0,3,4,7,0,0,0,0,0,0,1,3,0,0,0,2,0];
				case "level_578":
					return [0,0,1,7,0,6,0,9,0,0,0,0,0,9,0,0,0,1,0,4,0,3,0,0,0,0,5,0,0,4,0,0,0,0,8,6,0,0,5,0,6,0,4,0,0,6,9,0,0,0,0,2,0,0,7,0,0,0,0,1,0,4,0,3,0,0,0,8,0,0,0,0,0,1,0,2,0,3,6,0,0];
				case "level_579":
					return [0,0,9,0,0,5,0,0,0,1,8,0,9,0,0,0,5,0,3,0,2,0,7,0,0,0,0,0,0,0,2,0,7,3,0,0,0,1,0,0,0,0,0,9,0,0,0,3,8,0,1,0,0,0,0,0,0,0,5,0,6,0,2,0,3,0,0,0,6,0,7,8,0,0,0,1,0,0,4,0,0];
				case "level_580":
					return [0,0,0,6,0,0,0,7,1,0,0,2,0,4,0,0,0,5,0,3,6,0,0,0,0,2,0,2,0,0,0,9,0,0,0,0,0,5,0,0,1,0,0,4,0,0,0,0,0,5,0,0,0,3,0,6,0,0,0,0,7,1,0,1,0,0,0,3,0,5,0,0,4,9,0,0,0,7,0,0,0];
				case "level_581":
					return [2,5,0,6,0,0,0,0,9,0,7,3,0,4,0,0,0,0,0,0,6,0,0,9,0,0,0,0,0,0,3,0,4,7,0,0,5,0,0,0,0,0,0,0,6,0,0,7,2,0,5,0,0,0,0,0,0,5,0,0,8,0,0,0,0,0,0,9,0,1,3,0,7,0,0,0,0,1,0,2,4];
				case "level_582":
					return [0,0,5,0,0,7,9,0,0,0,0,0,6,0,0,0,4,0,8,0,6,0,0,5,0,2,0,3,0,0,8,0,0,0,0,0,0,7,8,0,5,0,1,9,0,0,0,0,0,0,1,0,0,3,0,5,0,1,0,0,4,0,7,0,8,0,0,0,6,0,0,0,0,0,1,4,0,0,8,0,0];
				case "level_583":
					return [6,0,0,0,8,0,2,5,0,0,7,0,0,3,0,0,0,0,4,5,0,6,0,0,0,0,0,0,0,0,3,4,0,7,8,0,2,0,0,0,0,0,0,0,3,0,8,1,0,9,7,0,0,0,0,0,0,0,0,3,0,7,6,0,0,0,0,7,0,0,3,0,0,3,4,0,1,0,0,0,8];
				case "level_584":
					return [0,0,4,0,0,3,2,7,1,0,9,0,0,0,0,0,0,0,7,0,8,0,0,2,0,0,0,0,2,0,0,9,5,0,0,0,0,0,9,0,1,0,6,0,0,0,0,0,7,2,0,0,3,0,0,0,0,1,0,0,5,0,6,0,0,0,0,0,0,0,4,0,4,3,6,2,0,0,8,0,0];
				case "level_585":
					return [0,0,0,0,0,0,0,0,0,4,2,0,5,0,3,0,0,0,1,0,8,2,6,0,0,0,0,0,1,0,0,0,0,0,7,9,0,9,0,0,5,0,0,6,0,7,3,0,0,0,0,0,4,0,0,0,0,0,3,4,8,0,7,0,0,0,8,0,7,0,3,1,0,0,0,0,0,0,0,0,0];
				case "level_586":
					return [9,1,0,4,0,0,0,0,0,0,0,8,0,6,0,3,0,0,4,0,0,8,0,2,0,5,0,0,7,0,5,2,0,0,0,0,0,5,0,0,0,0,0,7,0,0,0,0,0,7,1,0,3,0,0,3,0,7,0,5,0,0,6,0,0,5,0,3,0,9,0,0,0,0,0,0,0,4,0,1,3];
				case "level_587":
					return [0,0,0,0,8,0,0,0,0,3,8,0,1,7,0,0,0,2,0,0,0,0,0,4,0,9,5,0,0,0,0,9,0,3,0,6,0,7,0,0,0,0,0,1,0,6,0,5,0,2,0,0,0,0,2,6,0,7,0,0,0,0,0,7,0,0,0,5,9,0,4,1,0,0,0,0,4,0,0,0,0];
				case "level_588":
					return [4,0,0,0,0,2,3,0,6,0,7,0,9,0,0,0,0,0,0,0,8,0,0,1,0,0,4,8,9,0,0,0,0,0,1,0,0,0,6,0,0,0,7,0,0,0,1,0,0,0,0,0,5,2,1,0,0,2,0,0,9,0,0,0,0,0,0,0,7,0,2,0,5,0,9,4,0,0,0,0,7];
				case "level_589":
					return [0,0,0,8,0,0,0,0,2,0,0,5,0,0,2,7,0,0,0,6,8,0,3,4,0,0,0,8,4,0,0,0,0,0,0,0,7,0,3,0,5,0,2,0,8,0,0,0,0,0,0,0,7,6,0,0,0,5,6,0,1,9,0,0,0,9,1,0,0,8,0,0,1,0,0,0,0,7,0,0,0];
				case "level_590":
					return [0,0,0,6,0,0,0,0,8,0,0,3,0,0,8,5,0,0,0,1,6,0,4,2,0,0,0,6,2,0,0,0,0,0,0,0,5,0,4,0,3,0,8,0,6,0,0,0,0,0,0,0,5,1,0,0,0,3,1,0,7,9,0,0,0,9,7,0,0,6,0,0,7,0,0,0,0,5,0,0,0];
				case "level_591":
					return [4,9,0,0,8,0,0,0,0,5,0,7,2,0,0,1,0,0,0,2,0,0,0,1,0,0,0,0,0,0,9,0,8,0,4,0,0,0,5,0,0,0,2,0,0,0,4,0,7,0,5,0,0,0,0,0,0,5,0,0,0,6,0,0,0,4,0,0,3,8,0,7,0,0,0,0,1,0,0,3,9];
				case "level_592":
					return [9,0,0,0,2,7,0,0,0,4,2,1,0,0,0,0,0,7,0,0,0,8,0,0,2,0,5,0,0,0,0,6,0,0,1,9,0,0,6,0,0,0,3,0,0,7,8,0,0,9,0,0,0,0,8,0,9,0,0,1,0,0,0,5,0,0,0,0,0,1,6,3,0,0,0,5,3,0,0,0,8];
				case "level_593":
					return [0,0,0,1,0,0,6,5,0,2,0,0,0,8,0,0,0,3,0,0,0,0,0,0,0,9,4,0,0,2,3,0,7,0,0,5,0,3,0,0,0,0,0,2,0,8,0,0,9,0,4,7,0,0,7,1,0,0,0,0,0,0,0,4,0,0,0,7,0,0,0,1,0,9,8,0,0,1,0,0,0];
				case "level_594":
					return [0,0,0,0,0,3,4,0,0,0,9,0,4,0,0,0,0,8,8,2,0,5,0,0,0,3,0,0,0,9,0,0,0,2,4,0,6,0,0,0,0,0,0,0,3,0,1,8,0,0,0,9,0,0,0,5,0,0,0,4,0,6,7,1,0,0,0,0,9,0,5,0,0,0,3,8,0,0,0,0,0];
				case "level_595":
					return [0,0,0,0,0,0,0,0,0,0,0,0,9,0,4,0,2,1,0,0,0,0,3,1,5,6,0,8,7,0,0,0,0,0,0,6,3,0,0,0,4,0,0,0,7,2,0,0,0,0,0,0,8,9,0,8,5,2,9,0,0,0,0,9,6,0,8,0,5,0,0,0,0,0,0,0,0,0,0,0,0];
				case "level_596":
					return [2,0,0,0,0,0,0,0,8,0,3,8,4,0,0,0,0,0,0,5,0,1,7,8,0,0,0,3,0,5,0,8,0,0,0,0,0,1,0,0,0,0,0,5,0,0,0,0,0,1,0,9,0,4,0,0,0,3,9,1,0,7,0,0,0,0,0,0,6,8,1,0,5,0,0,0,0,0,0,0,3];
				case "level_597":
					return [0,0,0,0,5,0,9,0,4,7,0,0,8,0,0,3,6,0,9,0,0,2,0,0,0,0,0,0,0,0,0,0,7,4,0,0,2,6,0,1,0,9,0,7,8,0,0,7,6,0,0,0,0,0,0,0,0,0,0,6,0,0,5,0,7,6,0,0,8,0,0,3,8,0,4,0,7,0,0,0,0];
				case "level_598":
					return [2,0,0,0,0,0,0,0,0,0,5,6,0,0,1,0,0,0,0,0,4,0,0,8,5,2,7,7,0,0,0,8,3,0,0,0,0,0,5,0,1,0,9,0,0,0,0,0,6,9,0,0,0,8,3,1,8,7,0,0,2,0,0,0,0,0,8,0,0,4,3,0,0,0,0,0,0,0,0,0,9];
				case "level_599":
					return [0,0,0,0,3,1,0,0,2,2,0,8,0,0,0,0,0,6,0,0,0,0,0,0,8,4,0,0,8,1,2,5,3,0,7,0,0,0,0,0,0,0,0,0,0,0,5,0,1,4,9,2,3,0,0,9,2,0,0,0,0,0,0,4,0,0,0,0,0,1,0,7,8,0,0,5,6,0,0,0,0];
				case "level_600":
					return [0,7,5,0,0,0,4,0,0,4,0,0,0,0,2,7,0,0,3,0,0,1,0,7,0,0,0,0,1,0,2,0,4,0,0,0,0,8,0,5,0,1,0,6,0,0,0,0,3,0,6,0,2,0,0,0,0,6,0,9,0,0,5,0,0,2,4,0,0,0,0,7,0,0,9,0,0,0,8,4,0];
				case "level_601":
					return [0,0,1,0,6,0,0,0,9,5,0,0,0,7,0,4,0,0,0,6,2,0,0,8,0,0,0,0,7,0,0,4,0,8,0,0,1,0,0,8,0,7,0,0,3,0,0,4,0,2,0,0,7,0,0,0,0,6,0,0,3,5,0,0,0,5,0,3,0,0,0,8,3,0,0,0,9,0,1,0,0];
				case "level_602":
					return [0,7,0,0,0,0,0,9,8,0,6,2,0,0,8,0,0,0,0,0,5,0,3,0,0,0,7,0,0,0,0,4,0,7,0,0,0,3,0,0,2,0,0,5,0,0,0,9,0,5,0,0,0,0,5,0,0,0,9,0,2,0,0,0,0,0,6,0,0,3,4,0,6,2,0,0,0,0,0,8,0];
				case "level_603":
					return [0,0,0,0,4,0,0,8,0,0,7,0,0,0,0,4,2,0,0,0,5,0,9,0,0,0,7,0,0,8,0,0,9,0,0,0,3,0,4,0,1,0,9,0,5,0,0,0,6,0,0,8,0,0,6,0,0,0,2,0,3,0,0,0,1,3,0,0,0,0,6,0,0,2,0,0,7,0,0,0,0];
				case "level_604":
					return [7,0,0,0,5,3,6,0,8,9,0,2,1,0,0,0,0,0,0,0,0,0,6,0,0,0,0,4,8,0,0,2,0,0,0,0,0,0,3,0,0,0,5,0,0,0,0,0,0,7,0,0,9,4,0,0,0,0,1,0,0,0,0,0,0,0,0,0,5,4,0,7,3,0,1,2,9,0,0,0,5];
				case "level_605":
					return [7,0,0,8,2,6,0,0,0,0,0,4,0,0,0,0,2,9,0,0,3,0,0,1,0,0,6,0,0,0,0,0,9,0,0,8,4,0,7,0,0,0,3,0,5,6,0,0,7,0,0,0,0,0,5,0,0,3,0,0,4,0,0,2,4,0,0,0,0,6,0,0,0,0,0,6,7,4,0,0,2];
				case "level_606":
					return [0,0,0,0,0,5,0,0,7,6,7,0,0,4,0,0,0,0,0,9,8,0,0,2,0,0,3,0,6,0,3,0,0,0,0,0,2,0,3,7,0,1,8,0,5,0,0,0,0,0,8,0,3,0,9,0,0,2,0,0,3,8,0,0,0,0,0,3,0,0,6,2,4,0,0,8,0,0,0,0,0];
				case "level_607":
					return [0,0,2,5,0,0,0,0,9,0,0,0,0,7,9,2,0,0,4,1,0,6,0,0,0,0,0,0,0,3,0,0,0,4,0,1,0,8,0,0,6,0,0,5,0,2,0,1,0,0,0,6,0,0,0,0,0,0,0,6,0,2,7,0,0,6,3,9,0,0,0,0,9,0,0,0,0,8,5,0,0];
				case "level_608":
					return [3,0,0,2,0,6,0,0,0,8,0,0,0,0,9,0,7,0,0,4,9,0,0,0,0,2,0,0,0,7,6,0,1,0,0,0,0,0,6,5,0,3,4,0,0,0,0,0,9,0,7,5,0,0,0,9,0,0,0,0,8,3,0,0,8,0,7,0,0,0,0,9,0,0,0,8,0,5,0,0,1];
				case "level_609":
					return [0,0,0,3,0,0,5,0,0,0,0,0,0,4,0,0,7,6,0,0,5,0,9,6,0,3,0,9,6,0,0,3,0,0,1,0,0,0,0,0,0,0,0,0,0,0,8,0,0,6,0,0,5,3,0,7,0,6,1,0,2,0,0,6,4,0,0,8,0,0,0,0,0,0,8,0,0,7,0,0,0];
				case "level_610":
					return [0,9,0,0,0,0,0,4,7,6,0,0,0,0,7,0,0,1,0,0,1,0,0,0,9,0,0,0,0,0,5,0,0,0,1,9,0,5,0,9,4,8,0,3,0,3,6,0,0,0,2,0,0,0,0,0,6,0,0,0,8,0,0,2,0,0,7,0,0,0,0,4,9,4,0,0,0,0,0,2,0];
				case "level_611":
					return [0,0,2,4,1,0,0,0,8,7,0,0,0,0,0,0,3,6,0,0,0,0,8,0,5,0,0,0,0,0,0,0,5,0,0,0,0,1,9,0,6,0,3,7,0,0,0,0,9,0,0,0,0,0,0,0,7,0,2,0,0,0,0,3,4,0,0,0,0,0,0,5,1,0,0,0,9,4,8,0,0];
				case "level_612":
					return [1,3,0,0,0,0,0,0,6,2,0,0,0,5,0,0,0,0,0,0,6,0,2,0,0,3,0,0,0,0,6,0,0,0,8,0,0,4,3,0,1,0,7,9,0,0,8,0,0,0,9,0,0,0,0,7,0,0,9,0,5,0,0,0,0,0,0,4,0,0,0,8,5,0,0,0,0,0,0,4,2];
				case "level_613":
					return [0,0,0,0,0,6,0,7,0,1,0,3,0,0,8,0,2,0,7,9,0,0,5,0,0,0,0,9,0,0,2,0,0,0,0,0,0,8,2,7,0,4,3,6,0,0,0,0,0,0,3,0,0,2,0,0,0,0,2,0,0,8,9,0,1,0,8,0,0,2,0,3,0,5,0,3,0,0,0,0,0];
				case "level_614":
					return [1,0,0,0,2,0,0,8,5,0,0,0,0,0,4,0,6,0,0,3,8,0,1,0,0,0,0,6,7,0,0,0,2,9,0,0,0,0,0,0,7,0,0,0,0,0,0,9,5,0,0,0,2,8,0,0,0,0,6,0,5,7,0,0,5,0,4,0,0,0,0,0,7,9,0,0,5,0,0,0,2];
				case "level_615":
					return [9,0,0,0,1,0,0,5,7,4,0,0,0,0,2,8,0,0,3,0,0,0,0,0,0,1,0,2,9,0,5,0,0,0,0,0,0,0,0,6,3,9,0,0,0,0,0,0,0,0,4,0,3,9,0,4,0,0,0,0,0,0,8,0,0,6,9,0,0,0,0,2,8,7,0,0,6,0,0,0,1];
				case "level_616":
					return [0,0,5,0,0,0,0,0,1,4,0,9,0,5,0,0,0,8,0,7,0,6,0,0,0,0,3,0,0,0,0,0,9,8,0,6,0,0,0,8,1,2,0,0,0,8,0,1,3,0,0,0,0,0,6,0,0,0,0,8,0,2,0,5,0,0,0,2,0,4,0,7,7,0,0,0,0,0,3,0,0];
				case "level_617":
					return [1,8,0,0,2,0,0,0,0,0,3,0,0,0,1,2,0,6,0,0,5,0,0,4,0,0,0,0,0,0,0,5,0,0,8,0,0,0,1,4,7,8,9,0,0,0,6,0,0,1,0,0,0,0,0,0,0,3,0,0,6,0,0,7,0,3,1,0,0,0,9,0,0,0,0,0,9,0,0,7,5];
				case "level_618":
					return [0,0,0,0,0,6,0,4,0,0,2,4,0,5,0,0,0,0,7,0,1,0,0,3,0,9,0,0,0,2,9,0,0,0,0,0,9,3,0,4,0,8,0,6,7,0,0,0,0,0,7,9,0,0,0,1,0,3,0,0,7,0,9,0,0,0,0,9,0,2,3,0,0,5,0,7,0,0,0,0,0];
				case "level_619":
					return [0,0,0,0,4,0,0,1,8,0,0,0,5,0,0,0,6,0,0,0,3,0,0,1,7,0,9,0,3,0,9,0,5,0,0,0,0,0,5,0,0,0,2,0,0,0,0,0,8,0,7,0,3,0,5,0,9,2,0,0,4,0,0,0,2,0,0,0,4,0,0,0,3,8,0,0,7,0,0,0,0];
				case "level_620":
					return [5,0,6,7,0,0,2,0,0,0,0,0,3,0,0,0,0,0,8,0,0,0,2,0,1,0,0,1,0,0,0,0,0,8,0,0,0,4,9,8,0,6,5,1,0,0,0,2,0,0,0,0,0,9,0,0,4,0,9,0,0,0,7,0,0,0,0,0,5,0,0,0,0,0,3,0,0,7,9,0,6];
				case "level_621":
					return [0,6,0,0,0,0,5,0,0,0,0,0,0,3,0,9,6,0,0,0,0,6,0,0,3,2,0,8,0,0,0,9,6,0,0,0,6,4,0,3,0,2,0,9,5,0,0,0,5,1,0,0,0,6,0,5,4,0,0,9,0,0,0,0,7,6,0,8,0,0,0,0,0,0,2,0,0,0,0,7,0];
				case "level_622":
					return [2,0,0,1,0,0,0,0,8,4,0,0,0,0,8,0,0,9,0,0,6,3,9,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,3,9,6,1,7,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,7,4,3,0,0,9,0,0,5,0,0,0,0,2,3,0,0,0,0,9,0,0,4];
				case "level_623":
					return [3,0,0,0,6,0,1,0,0,8,0,9,0,0,1,0,0,2,0,0,0,9,0,3,0,5,0,2,0,4,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,9,0,4,0,4,0,8,0,9,0,0,0,5,0,0,4,0,0,2,0,6,0,0,3,0,5,0,0,0,7];
				case "level_624":
					return [0,0,0,0,9,7,8,0,0,3,0,0,6,0,0,0,0,0,0,8,0,0,0,0,0,2,9,0,2,1,0,0,8,0,5,4,0,0,0,0,0,0,0,0,0,6,3,0,5,0,0,2,8,0,7,4,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,7,0,0,5,8,7,0,0,0,0];
				case "level_625":
					return [0,0,0,0,4,0,0,6,5,0,0,9,0,1,6,0,0,8,0,0,0,8,0,0,9,0,0,6,1,0,0,8,0,0,0,7,0,0,0,0,0,0,0,0,0,3,0,0,0,6,0,0,8,9,0,0,3,0,0,5,0,0,0,5,0,0,6,7,0,2,0,0,4,6,0,0,3,0,0,0,0];
				case "level_626":
					return [2,6,3,1,0,0,9,0,0,0,0,0,3,0,0,8,2,0,0,0,0,0,0,0,0,0,7,0,0,0,4,7,0,0,0,3,0,0,5,0,6,0,7,0,0,1,0,0,0,3,2,0,0,0,9,0,0,0,0,0,0,0,0,0,5,4,0,0,6,0,0,0,0,0,8,0,0,3,5,9,1];
				case "level_627":
					return [0,5,7,0,3,0,2,0,0,0,0,0,1,4,0,0,0,7,0,6,0,5,0,0,0,0,0,0,0,0,2,0,0,0,3,0,8,0,2,0,6,0,4,0,1,0,9,0,0,0,1,0,0,0,0,0,0,0,0,3,0,8,0,7,0,0,0,9,2,0,0,0,0,0,3,0,1,0,6,4,0];
				case "level_628":
					return [0,4,0,8,0,0,5,1,0,0,0,8,0,2,0,0,7,0,6,0,0,7,0,5,0,0,0,7,0,0,0,0,0,3,4,0,0,0,0,0,0,0,0,0,0,0,3,5,0,0,0,0,0,6,0,0,0,5,0,1,0,0,3,0,9,0,0,6,0,7,0,0,0,2,4,0,0,3,0,6,0];
				case "level_629":
					return [0,3,0,0,0,0,0,0,9,0,0,1,0,0,5,0,0,0,7,0,8,3,0,1,0,0,0,1,0,0,0,0,0,0,2,0,4,0,3,1,0,2,8,0,5,0,7,0,0,0,0,0,0,1,0,0,0,9,0,4,7,0,2,0,0,0,2,0,0,1,0,0,6,0,0,0,0,0,0,9,0];
				case "level_630":
					return [0,0,1,0,0,7,0,6,0,0,0,3,0,0,0,0,4,1,0,4,0,1,9,3,0,0,0,0,0,0,0,0,9,0,3,0,0,6,7,0,0,0,9,1,0,0,2,0,5,0,0,0,0,0,0,0,0,3,4,2,0,9,0,4,5,0,0,0,0,1,0,0,0,3,0,8,0,0,7,0,0];
				case "level_631":
					return [0,0,0,8,0,0,2,0,4,9,6,0,0,4,0,0,0,0,0,0,2,0,3,6,0,0,9,0,0,0,0,0,4,0,7,1,0,0,6,0,0,0,9,0,0,1,3,0,7,0,0,0,0,0,5,0,0,9,2,0,3,0,0,0,0,0,0,7,0,0,8,2,3,0,4,0,0,5,0,0,0];
				case "level_632":
					return [2,0,0,0,0,0,0,0,5,0,0,7,0,2,6,0,9,0,0,0,0,0,0,0,3,1,0,0,0,6,0,0,2,5,3,0,7,0,0,6,0,8,0,0,4,0,3,2,9,0,0,8,0,0,0,7,4,0,0,0,0,0,0,0,9,0,7,6,0,2,0,0,1,0,0,0,0,0,0,0,7];
				case "level_633":
					return [7,0,0,0,0,8,9,5,2,0,3,0,0,0,0,0,0,0,6,0,5,0,0,2,0,0,0,0,2,0,0,3,1,0,0,0,3,0,0,0,9,0,0,0,4,0,0,0,5,2,0,0,8,0,0,0,0,9,0,0,4,0,1,0,0,0,0,0,0,0,7,0,4,8,7,2,0,0,0,0,6];
				case "level_634":
					return [0,9,0,0,0,4,0,0,7,0,3,0,0,7,0,6,1,0,0,1,0,0,0,0,8,0,0,0,4,5,8,0,0,0,0,0,0,0,0,4,5,7,0,0,0,0,0,0,0,0,2,4,9,0,0,0,3,0,0,0,0,5,0,0,6,2,0,3,0,0,4,0,1,0,0,9,0,0,0,8,0];
				case "level_635":
					return [0,0,0,0,0,1,0,2,7,3,0,0,0,0,5,4,0,0,0,0,4,3,6,0,0,0,0,2,0,7,0,0,0,9,0,0,0,5,0,0,1,0,0,8,0,0,0,1,0,0,0,2,0,4,0,0,0,0,3,9,1,0,0,0,0,5,8,0,0,0,0,3,6,4,0,1,0,0,0,0,0];
				case "level_636":
					return [0,0,9,6,0,0,2,0,0,0,6,0,0,0,4,0,0,0,0,0,0,1,8,0,4,0,7,0,0,0,0,0,0,0,4,1,0,4,6,0,2,0,8,9,0,9,7,0,0,0,0,0,0,0,3,0,5,0,7,2,0,0,0,0,0,0,9,0,0,0,5,0,0,0,4,0,0,5,3,0,0];
				case "level_637":
					return [0,0,9,0,0,5,0,0,0,8,0,0,7,0,0,0,6,0,5,0,0,1,0,9,0,0,4,0,0,6,9,0,0,0,4,0,0,0,8,0,0,0,6,0,0,0,3,0,0,0,1,9,0,0,9,0,0,5,0,2,0,0,7,0,2,0,0,0,3,0,0,6,0,0,0,4,0,0,1,0,0];
				case "level_638":
					return [5,7,0,3,0,0,2,6,0,0,9,0,0,2,0,0,5,4,0,0,0,0,0,5,0,0,0,2,0,0,0,0,0,8,0,0,0,0,7,0,8,0,1,0,0,0,0,4,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,4,5,0,0,6,0,0,3,0,0,6,9,0,0,3,0,2,1];
				case "level_639":
					return [0,4,8,6,0,9,0,0,0,9,0,6,5,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,6,4,0,0,1,0,0,2,0,0,3,0,0,6,3,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,7,8,0,9,0,0,0,4,0,2,5,7,0];
				case "level_640":
					return [7,0,0,0,9,3,1,0,0,0,0,6,1,2,0,0,8,0,0,2,0,7,0,0,0,0,0,0,0,0,0,0,5,0,0,1,8,0,2,0,0,0,5,0,3,1,0,0,2,0,0,0,0,0,0,0,0,0,0,9,0,4,0,0,7,0,0,4,2,6,0,0,0,0,4,3,1,0,0,0,7];
				case "level_641":
					return [0,6,0,0,1,0,9,0,0,3,0,9,0,0,0,0,0,6,1,0,0,0,7,0,0,0,0,0,0,0,6,0,0,2,0,0,0,9,8,0,3,0,5,4,0,0,0,2,0,0,5,0,0,0,0,0,0,0,8,0,0,0,2,7,0,0,0,0,0,8,0,1,0,0,4,0,5,0,0,7,0];
				case "level_642":
					return [0,6,0,0,1,0,7,0,0,0,0,0,5,0,0,0,0,8,0,0,0,0,4,7,0,0,1,0,7,0,0,0,0,8,0,5,0,8,4,0,5,0,2,7,0,9,0,5,0,0,0,0,4,0,4,0,0,6,3,0,0,0,0,7,0,0,0,0,1,0,0,0,0,0,3,0,8,0,0,5,0];
				case "level_643":
					return [0,0,2,0,6,0,0,0,8,0,0,8,0,0,0,0,1,0,0,0,0,9,0,0,6,7,0,4,0,3,0,9,0,0,0,0,0,2,0,1,7,3,0,6,0,0,0,0,0,4,0,3,0,5,0,9,5,0,0,8,0,0,0,0,3,0,0,0,0,7,0,0,1,0,0,0,3,0,5,0,0];
				case "level_644":
					return [0,9,0,6,1,0,8,0,0,0,6,5,0,0,0,0,0,0,3,0,0,0,0,0,0,0,6,0,2,8,9,0,0,4,0,0,6,0,0,1,0,4,0,0,5,0,0,1,0,0,8,7,2,0,8,0,0,0,0,0,0,0,7,0,0,0,0,0,0,2,3,0,0,0,6,0,8,1,0,9,0];
				case "level_645":
					return [4,0,0,6,0,0,3,9,0,0,0,0,0,0,7,0,8,0,0,0,1,0,3,0,0,0,4,0,8,0,0,5,0,0,0,0,1,0,2,9,0,6,8,0,7,0,0,0,0,7,0,0,5,0,5,0,0,0,1,0,2,0,0,0,4,0,7,0,0,0,0,0,0,1,3,0,0,5,0,0,6];
				case "level_646":
					return [0,0,0,0,6,0,3,8,0,0,0,8,7,0,0,0,0,0,3,0,2,0,8,0,0,0,9,0,2,0,8,0,0,9,0,4,0,0,0,0,3,0,0,0,0,6,0,3,0,0,9,0,2,0,1,0,0,0,9,0,4,0,8,0,0,0,0,0,7,6,0,0,0,4,5,0,1,0,0,0,0];
				case "level_647":
					return [4,0,0,9,0,8,0,0,0,0,5,0,0,0,6,0,4,0,0,0,0,0,1,0,0,7,9,0,0,0,0,0,0,6,0,0,8,7,0,0,0,0,0,3,2,0,0,2,0,0,0,0,0,0,1,6,0,0,9,0,0,0,0,0,9,0,3,0,0,0,8,0,0,0,0,7,0,4,0,0,5];
				case "level_648":
					return [3,0,9,2,0,0,0,0,0,1,0,0,0,5,0,0,0,0,0,0,2,0,8,0,0,7,3,0,0,0,5,9,0,0,1,8,0,0,7,0,0,0,5,0,0,8,4,0,0,6,1,0,0,0,5,9,0,0,4,0,8,0,0,0,0,0,0,1,0,0,0,5,0,0,0,0,0,5,2,0,1];
				case "level_649":
					return [0,0,0,3,0,5,0,7,8,0,1,0,0,0,0,5,0,0,0,0,0,9,0,0,0,0,3,0,0,6,0,0,0,0,3,0,8,9,0,6,0,3,0,4,5,0,3,0,0,0,0,7,0,0,3,0,0,0,0,6,0,0,0,0,0,1,0,0,0,0,2,0,7,6,0,4,0,1,0,0,0];
				case "level_650":
					return [0,4,0,0,0,8,0,3,0,1,8,0,0,0,3,6,0,0,0,0,0,5,0,0,4,0,0,9,0,0,3,0,0,0,0,0,0,3,2,0,6,0,1,4,0,0,0,0,0,0,4,0,0,9,0,0,8,0,0,5,0,0,0,0,0,7,6,0,0,0,5,4,0,2,0,1,0,0,0,6,0];
				case "level_651":
					return [0,0,0,0,0,9,7,0,5,6,0,0,0,0,4,0,1,0,0,9,0,8,6,0,0,0,0,7,3,0,0,0,0,0,9,0,0,0,4,0,9,0,1,0,0,0,8,0,0,0,0,0,2,3,0,0,0,0,5,6,0,7,0,0,7,0,1,0,0,0,0,6,2,0,3,9,0,0,0,0,0];
				case "level_652":
					return [7,8,0,6,4,0,0,0,9,0,0,0,0,8,0,0,0,0,0,0,0,0,0,9,0,5,2,0,0,0,0,2,0,4,0,5,0,7,0,0,0,0,0,9,0,5,0,3,0,6,0,0,0,0,4,6,0,8,0,0,0,0,0,0,0,0,0,1,0,0,0,0,2,0,0,0,9,7,0,1,3];
				case "level_653":
					return [0,9,0,0,6,0,1,0,4,0,0,7,0,5,0,0,0,0,0,3,1,9,0,0,0,0,0,0,0,0,5,3,0,6,0,7,0,4,0,0,0,0,0,5,0,8,0,6,0,2,7,0,0,0,0,0,0,0,0,5,7,9,0,0,0,0,0,7,0,5,0,0,3,0,5,0,8,0,0,6,0];
				case "level_654":
					return [2,0,0,4,6,9,0,0,0,5,9,0,0,0,8,0,0,0,0,1,0,0,0,0,0,0,0,9,4,0,0,0,0,0,0,2,0,2,0,0,3,0,0,6,0,1,0,0,0,0,0,0,7,3,0,0,0,0,0,0,0,1,0,0,0,0,9,0,0,0,5,4,0,0,0,2,8,5,0,0,7];
				case "level_655":
					return [0,0,0,0,2,7,0,6,0,6,0,0,0,0,8,0,0,7,8,0,0,3,0,0,0,0,1,0,0,0,0,0,0,0,5,0,0,6,0,8,5,4,0,2,0,0,1,0,0,0,0,0,0,0,7,0,0,0,0,9,0,0,8,1,0,0,4,0,0,0,0,9,0,5,0,6,8,0,0,0,0];
				case "level_656":
					return [8,0,0,5,6,0,2,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,9,0,6,0,0,8,0,0,0,0,7,2,0,9,0,0,2,3,6,0,0,1,0,4,2,0,0,0,0,5,0,0,5,0,1,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,1,7,0,4,3,0,0,6];
				case "level_657":
					return [0,4,0,0,9,8,2,0,0,0,0,5,0,4,0,0,0,0,3,7,0,0,0,0,0,6,0,0,0,0,5,0,0,0,0,0,6,0,3,0,7,0,1,0,9,0,0,0,0,0,1,0,0,0,0,5,0,0,0,0,0,3,8,0,0,0,0,2,0,6,0,0,0,0,4,8,1,0,0,9,0];
				case "level_658":
					return [0,0,7,0,0,8,0,0,2,5,0,2,0,0,0,4,0,1,4,0,0,7,1,0,0,0,0,0,7,0,0,0,0,0,0,6,0,0,5,0,3,0,8,0,0,6,0,0,0,0,0,0,2,0,0,0,0,0,9,3,0,0,8,8,0,6,0,0,0,2,0,5,9,0,0,2,0,0,7,0,0];
				case "level_659":
					return [0,0,0,6,0,0,0,7,1,9,0,0,0,7,5,0,0,0,2,4,7,0,0,0,0,0,5,0,0,0,0,8,0,4,0,9,0,8,0,0,0,0,0,3,0,5,0,6,0,9,0,0,0,0,1,0,0,0,0,0,8,4,3,0,0,0,1,3,0,0,0,6,6,9,0,0,0,4,0,0,0];
				case "level_660":
					return [0,7,0,2,0,3,9,0,0,0,0,0,0,0,9,6,4,0,5,0,0,0,8,0,0,0,3,0,0,0,0,2,7,0,1,0,0,1,0,0,0,0,0,7,0,0,5,0,4,1,0,0,0,0,6,0,0,0,5,0,0,0,7,0,4,5,9,0,0,0,0,0,0,0,8,7,0,1,0,5,0];
				case "level_661":
					return [0,1,0,0,0,0,0,8,3,0,0,2,0,4,0,0,0,1,0,9,6,0,0,3,0,0,0,0,0,0,0,5,0,1,0,0,0,4,0,0,6,0,0,2,0,0,0,8,0,2,0,0,0,0,0,0,0,9,0,0,4,5,0,2,0,0,0,8,0,6,0,0,9,6,0,0,0,0,0,3,0];
				case "level_662":
					return [0,4,0,5,0,0,8,0,0,8,9,0,0,0,0,3,0,0,0,0,0,3,2,8,0,9,0,0,3,0,2,0,0,0,0,0,0,8,2,0,0,0,5,4,0,0,0,0,0,0,1,0,6,0,0,2,0,6,9,3,0,0,0,0,0,8,0,0,0,0,1,9,0,0,5,0,0,7,0,3,0];
				case "level_663":
					return [0,8,0,0,5,0,0,4,0,0,0,0,0,0,0,0,1,7,0,0,0,9,0,0,2,0,6,0,0,8,4,0,3,0,6,0,4,0,0,0,0,0,0,0,8,0,5,0,7,0,1,3,0,0,7,0,5,0,0,9,0,0,0,9,3,0,0,0,0,0,0,0,0,1,0,0,3,0,0,9,0];
				case "level_664":
					return [0,0,2,0,3,0,6,4,0,0,0,0,0,0,7,0,1,0,4,9,0,0,2,0,0,0,0,0,8,1,0,0,3,0,0,5,0,0,0,0,8,0,0,0,0,5,0,0,6,0,0,4,3,0,0,0,0,0,1,0,0,8,6,0,6,0,7,0,0,0,0,0,0,5,8,0,6,0,3,0,0];
				case "level_665":
					return [0,7,0,4,3,0,0,0,0,6,5,0,0,0,0,0,7,8,1,0,0,0,0,6,0,3,0,0,0,6,0,0,0,0,8,0,7,0,0,0,4,0,0,0,5,0,8,0,0,0,0,1,0,0,0,6,0,7,0,0,0,0,1,2,9,0,0,0,0,0,5,6,0,0,0,0,9,1,0,2,0];
				case "level_666":
					return [0,8,0,0,0,1,0,6,0,7,0,0,9,0,0,3,0,0,9,0,0,6,5,0,0,0,0,6,0,0,0,0,5,0,4,0,0,9,7,0,0,0,1,8,0,0,4,0,2,0,0,0,0,6,0,0,0,0,8,6,0,0,7,0,0,5,0,0,9,0,0,8,0,6,0,3,0,0,0,5,0];
				case "level_667":
					return [3,0,0,4,0,6,0,0,0,0,0,2,0,1,0,0,5,0,0,1,0,3,0,0,8,7,0,1,0,0,0,0,0,6,3,0,0,0,0,0,0,0,0,0,0,0,8,3,0,0,0,0,0,2,0,4,6,0,0,9,0,8,0,0,2,0,0,7,0,9,0,0,0,0,0,6,0,2,0,0,1];
				case "level_668":
					return [1,0,0,0,7,0,0,8,0,5,0,2,0,0,0,1,0,0,0,0,0,5,0,0,3,6,0,0,1,0,0,4,0,0,0,0,0,0,8,0,6,0,7,0,0,0,0,0,0,8,0,0,2,0,0,7,4,0,0,3,0,0,0,0,0,5,0,0,0,6,0,3,0,6,0,0,2,0,0,0,8];
				case "level_669":
					return [0,4,0,0,0,0,0,2,0,0,0,9,5,2,0,0,0,1,6,0,8,0,0,0,0,0,0,4,0,6,2,0,0,0,0,5,0,7,0,3,0,5,0,1,0,3,0,0,0,0,9,6,0,2,0,0,0,0,0,0,1,0,7,2,0,0,0,5,1,9,0,0,0,1,0,0,0,0,0,8,0];
				case "level_670":
					return [0,9,0,0,0,1,5,0,0,0,0,6,0,0,8,7,9,0,1,0,0,6,0,0,0,0,0,7,0,1,0,0,0,0,0,5,0,6,0,0,0,0,0,4,0,5,0,0,0,0,0,3,0,9,0,0,0,0,0,9,0,0,6,0,2,4,1,0,0,8,0,0,0,0,8,5,0,0,0,3,0];
				case "level_671":
					return [0,0,1,4,0,0,3,0,0,0,0,0,0,2,6,0,0,7,0,0,7,0,0,1,6,0,0,0,0,0,0,0,0,0,0,8,7,0,0,1,8,5,0,0,2,3,0,0,0,0,0,0,0,0,0,0,3,5,0,0,9,0,0,8,0,0,7,1,0,0,0,0,0,0,6,0,0,9,1,0,0];
				case "level_672":
					return [5,0,0,3,8,6,0,0,0,1,6,0,4,0,0,0,0,0,0,0,2,0,0,0,6,0,0,0,5,1,0,6,0,0,0,0,3,0,0,0,0,0,0,0,5,0,0,0,0,3,0,4,7,0,0,0,5,0,0,0,1,0,0,0,0,0,0,0,9,0,6,3,0,0,0,1,7,3,0,0,8];
				case "level_673":
					return [9,0,0,0,0,6,7,0,0,0,5,0,4,0,0,0,3,0,0,0,0,0,8,5,6,0,0,0,2,0,8,0,0,5,0,0,4,3,0,0,0,0,0,6,7,0,0,5,0,0,1,0,2,0,0,0,7,5,3,0,0,0,0,0,8,0,0,0,9,0,5,0,0,0,3,6,0,0,0,0,8];
				case "level_674":
					return [0,0,0,0,0,3,8,0,0,0,1,7,0,4,0,0,0,0,4,0,0,0,6,0,1,0,2,8,0,9,0,0,6,0,5,0,0,0,0,0,9,0,0,0,0,0,5,0,2,0,0,6,0,1,9,0,5,0,2,0,0,0,6,0,0,0,0,8,0,9,2,0,0,0,2,3,0,0,0,0,0];
				case "level_675":
					return [0,0,0,0,0,6,0,4,3,0,0,6,7,4,0,5,0,0,0,1,0,0,9,0,0,0,0,0,0,9,5,0,0,0,2,6,5,0,0,0,0,0,0,0,4,6,2,0,0,0,8,1,0,0,0,0,0,0,3,0,0,5,0,0,0,4,0,2,7,6,0,0,2,3,0,6,0,0,0,0,0];
				case "level_676":
					return [0,7,0,0,0,0,0,1,0,0,0,0,0,0,0,4,0,8,0,0,6,0,7,3,0,0,5,0,0,3,0,0,7,1,0,4,0,6,0,3,0,2,0,9,0,4,0,7,5,0,0,2,0,0,5,0,0,6,3,0,7,0,0,6,0,9,0,0,0,0,0,0,0,8,0,0,0,0,0,6,0];
				case "level_677":
					return [8,0,0,6,0,0,9,0,0,2,0,0,5,0,1,0,0,7,0,1,0,0,0,2,0,0,0,0,9,0,1,0,0,7,0,0,0,8,0,0,0,0,0,9,0,0,0,3,0,0,5,0,1,0,0,0,0,7,0,0,0,5,0,1,0,0,2,0,4,0,0,6,0,0,4,0,0,3,0,0,9];
				case "level_678":
					return [1,0,0,0,7,6,0,0,0,0,0,0,9,0,0,0,2,1,7,9,5,0,0,0,0,0,6,0,0,0,0,2,0,1,0,3,0,7,0,0,0,0,0,5,0,2,0,9,0,5,0,0,0,0,3,0,0,0,0,0,4,9,8,6,4,0,0,0,1,0,0,0,0,0,0,3,4,0,0,0,2];
				case "level_679":
					return [7,0,0,0,0,0,5,0,8,0,0,0,0,1,0,0,4,0,0,9,0,5,6,0,0,0,2,0,0,0,0,0,6,0,0,0,0,8,4,0,3,0,2,6,0,0,0,0,7,0,0,0,0,0,9,0,0,0,2,5,0,1,0,0,7,0,0,9,0,0,0,0,3,0,8,0,0,0,0,0,4];
				case "level_680":
					return [0,1,0,0,0,0,0,2,0,0,0,5,3,0,0,7,0,0,7,0,6,0,0,0,0,0,5,1,0,4,0,0,5,0,0,0,8,0,0,6,7,2,0,0,4,0,0,0,8,0,0,6,0,9,6,0,0,0,0,0,3,0,7,0,0,1,0,0,3,9,0,0,0,9,0,0,0,0,0,6,0];
				case "level_681":
					return [8,0,0,0,0,3,0,7,0,0,9,0,0,1,0,0,0,0,0,0,0,9,0,5,0,8,4,0,4,0,0,3,0,0,0,8,0,2,0,0,6,0,0,5,0,1,0,0,0,2,0,0,6,0,2,8,0,3,0,4,0,0,0,0,0,0,0,8,0,0,2,0,0,3,0,7,0,0,0,0,9];
				case "level_682":
					return [3,7,0,0,4,0,0,0,0,1,0,0,0,0,0,0,7,0,6,2,0,0,0,8,0,0,0,0,0,0,2,5,0,3,0,0,0,6,3,9,0,1,2,8,0,0,0,4,0,8,3,0,0,0,0,0,0,3,0,0,0,1,9,0,3,0,0,0,0,0,0,2,0,0,0,0,9,0,0,3,8];
				case "level_683":
					return [4,0,0,0,3,0,8,2,0,0,0,0,6,4,0,0,0,0,0,0,0,0,0,0,3,4,7,0,0,4,0,9,8,0,0,0,0,9,0,1,0,5,0,6,0,0,0,0,4,7,0,1,0,0,8,1,9,0,0,0,0,0,0,0,0,0,0,8,4,0,0,0,0,4,7,0,1,0,0,0,2];
				case "level_684":
					return [0,0,5,8,0,0,0,4,6,0,0,9,4,0,0,0,0,0,0,0,0,0,6,0,8,2,0,0,0,0,0,0,4,0,6,0,6,0,8,3,0,7,1,0,4,0,2,0,6,0,0,0,0,0,0,3,2,0,9,0,0,0,0,0,0,0,0,0,1,3,0,0,4,5,0,0,0,8,6,0,0];
				case "level_685":
					return [6,0,0,0,2,0,4,0,7,9,0,0,0,0,0,2,0,0,3,0,0,0,0,8,0,1,0,8,0,6,4,0,0,0,0,0,0,0,0,5,9,6,0,0,0,0,0,0,0,0,3,9,0,6,0,5,0,6,0,0,0,0,8,0,0,3,0,0,0,0,0,1,1,0,7,0,5,0,0,0,2];
				case "level_686":
					return [0,0,0,6,0,0,0,0,0,0,1,7,0,0,8,9,0,6,4,0,6,0,1,0,5,0,0,0,3,0,0,0,0,0,0,1,0,2,0,0,3,0,0,9,0,6,0,0,0,0,0,0,4,0,0,0,8,0,7,0,6,0,4,2,0,1,8,0,0,7,5,0,0,0,0,0,0,4,0,0,0];
				case "level_687":
					return [0,0,9,0,6,7,0,0,8,0,0,0,8,0,0,5,0,9,6,4,0,0,1,0,0,0,0,0,0,0,0,0,1,0,9,2,0,0,7,0,0,0,3,0,0,2,1,0,5,0,0,0,0,0,0,0,0,0,5,0,0,3,7,5,0,6,0,0,4,0,0,0,7,0,0,3,9,0,6,0,0];
				case "level_688":
					return [0,0,6,0,0,5,0,0,7,5,0,0,4,0,8,0,1,0,0,0,8,0,9,0,0,0,0,2,0,1,0,0,0,0,4,0,0,3,0,0,1,0,0,7,0,0,7,0,0,0,0,1,0,9,0,0,0,0,2,0,5,0,0,0,5,0,6,0,1,0,0,2,7,0,0,8,0,0,3,0,0];
				case "level_689":
					return [9,0,0,0,2,0,0,7,5,6,0,0,0,0,3,2,0,0,5,0,0,0,0,0,0,4,0,3,1,0,4,0,0,0,0,0,0,0,0,3,1,2,0,0,0,0,0,0,0,0,8,0,3,6,0,9,0,0,0,0,0,0,1,0,0,5,6,0,0,0,0,4,7,8,0,0,9,0,0,0,3];
				case "level_690":
					return [0,0,0,0,0,2,0,5,0,5,3,0,0,7,0,0,0,0,0,0,6,0,5,0,3,8,0,0,6,1,0,0,5,0,0,8,0,0,0,0,3,0,0,0,0,8,0,0,6,0,0,7,3,0,0,1,5,0,6,0,9,0,0,0,0,0,0,9,0,0,4,1,0,7,0,2,0,0,0,0,0];
				case "level_691":
					return [3,0,7,0,8,0,0,6,0,0,0,0,0,4,0,7,0,0,0,0,0,0,0,7,4,9,0,8,0,6,0,5,4,0,0,0,0,1,0,0,0,0,0,7,0,0,0,0,7,3,0,6,0,4,0,3,2,9,0,0,0,0,0,0,0,4,0,7,0,0,0,0,0,9,0,0,6,0,2,0,1];
				case "level_692":
					return [0,3,0,7,0,0,0,0,9,8,6,0,0,0,0,0,4,3,0,0,0,0,6,9,0,8,0,0,2,0,0,0,0,9,0,0,7,0,0,0,1,0,0,0,4,0,0,3,0,0,0,0,2,0,0,7,0,1,5,0,0,0,0,3,4,0,0,0,0,0,7,2,9,0,0,0,0,3,0,5,0];
				case "level_693":
					return [6,0,0,3,0,9,0,0,5,0,9,0,0,0,6,0,0,0,1,0,0,2,0,0,4,0,0,0,4,0,9,0,0,5,0,0,0,1,0,0,0,0,0,4,0,0,0,8,0,0,3,0,9,0,0,0,7,0,0,8,0,0,4,0,0,0,5,0,0,0,3,0,9,0,0,6,0,7,0,0,2];
				case "level_694":
					return [6,0,0,0,9,7,0,0,0,0,3,0,0,8,0,0,0,7,0,0,5,0,0,0,0,1,0,0,2,4,0,0,8,0,0,9,7,5,0,0,0,0,0,2,4,9,0,0,2,0,0,6,7,0,0,6,0,0,0,0,2,0,0,5,0,0,0,2,0,0,3,0,0,0,0,7,1,0,0,0,6];
				case "level_695":
					return [3,0,0,0,7,8,4,0,0,0,8,0,0,0,0,0,5,0,0,0,0,0,0,0,8,0,2,6,0,0,0,0,4,1,0,3,0,2,0,6,0,7,0,8,0,9,0,1,3,0,0,0,0,7,1,0,5,0,0,0,0,0,0,0,9,0,0,0,0,0,3,0,0,0,4,7,3,0,0,0,8];
				case "level_696":
					return [9,0,0,0,0,0,3,1,2,6,5,0,0,0,1,0,0,0,0,0,0,9,2,0,0,0,6,7,0,6,0,5,0,0,0,0,0,3,0,0,0,0,0,2,0,0,0,0,0,3,0,1,0,5,5,0,0,0,4,7,0,0,0,0,0,0,6,0,0,0,4,9,8,1,4,0,0,0,0,0,7];
				case "level_697":
					return [0,0,0,0,2,0,0,1,9,0,0,7,0,0,8,6,0,0,0,0,0,0,0,5,0,7,0,7,0,0,0,0,0,0,3,1,9,0,0,7,0,1,0,0,5,1,8,0,0,0,0,0,0,6,0,7,0,2,0,0,0,0,0,0,0,4,6,0,0,2,0,0,2,6,0,0,1,0,0,0,0];
				case "level_698":
					return [2,3,0,8,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,8,0,0,1,9,0,6,4,0,2,1,0,3,0,0,0,0,8,0,0,0,0,0,0,0,6,0,0,0,0,9,0,5,2,0,7,5,0,6,8,0,0,3,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,4,0,1,9];
				case "level_699":
					return [0,0,0,0,6,5,4,0,0,8,7,0,0,0,0,0,9,2,0,0,0,0,0,0,0,0,0,0,8,0,0,3,0,2,0,7,0,0,7,0,5,0,6,0,0,3,0,4,0,7,0,0,1,0,0,0,0,0,0,0,0,0,0,9,2,0,0,0,0,0,7,4,0,0,5,9,4,0,0,0,0];
				case "level_700":
					return [0,0,0,0,8,9,0,0,4,0,0,0,0,0,2,9,6,0,2,0,0,3,4,0,0,0,0,0,0,6,0,0,0,0,4,0,9,7,0,0,2,0,0,3,6,0,5,0,0,0,0,2,0,0,0,0,0,0,9,4,0,0,5,0,3,4,1,0,0,0,0,0,7,0,0,2,3,0,0,0,0];
				case "level_701":
					return [0,0,0,0,5,0,0,4,0,3,0,0,0,4,0,7,0,0,0,7,0,0,0,0,0,2,3,1,0,0,0,0,7,0,0,0,9,0,8,0,2,0,3,0,6,0,0,0,9,0,0,0,0,1,6,4,0,0,0,0,0,5,0,0,0,5,0,9,0,0,0,8,0,1,0,0,6,0,0,0,0];
				case "level_702":
					return [6,8,0,0,3,0,0,0,0,0,4,0,1,0,0,0,9,0,0,0,0,2,0,6,0,0,4,0,0,1,0,0,0,0,0,0,5,7,0,0,0,0,0,8,2,0,0,0,0,0,0,5,0,0,9,0,0,4,0,8,0,0,0,0,2,0,0,0,7,0,6,0,0,0,0,0,6,0,0,1,3];
				case "level_703":
					return [0,0,7,0,0,8,0,5,0,0,6,0,7,3,9,0,0,0,0,0,9,0,0,0,0,6,7,0,0,0,0,0,3,0,9,0,0,5,8,0,0,0,3,7,0,0,2,0,4,0,0,0,0,0,6,4,0,0,0,0,7,0,0,0,0,0,9,6,2,0,3,0,0,9,0,1,0,0,8,0,0];
				case "level_704":
					return [0,9,0,0,5,0,6,0,0,0,7,3,4,0,0,2,0,9,0,0,0,7,0,0,8,0,0,3,0,0,0,0,0,0,7,0,1,0,0,9,0,5,0,0,8,0,6,0,0,0,0,0,0,4,0,0,5,0,0,6,0,0,0,7,0,1,0,0,9,4,3,0,0,0,6,0,1,0,0,8,0];
				case "level_705":
					return [0,5,0,7,8,0,0,0,0,0,9,0,0,0,0,3,6,0,1,0,2,0,0,0,0,0,0,7,0,0,3,9,1,2,0,4,0,0,0,0,0,0,0,0,0,5,0,3,2,7,4,0,0,6,0,0,0,0,0,0,5,0,9,0,2,5,0,0,0,0,8,0,0,0,0,0,4,3,0,2,0];
				case "level_706":
					return [4,0,0,0,1,0,3,0,0,0,9,0,2,0,0,0,0,0,0,6,1,0,0,8,0,0,4,0,0,0,0,5,0,0,9,0,2,0,9,8,0,6,7,0,3,0,5,0,0,2,0,0,0,0,8,0,0,5,0,0,1,3,0,0,0,0,0,0,2,0,4,0,0,0,7,0,3,0,0,0,5];
				case "level_707":
					return [0,0,0,0,0,4,0,2,0,0,6,2,0,9,0,0,0,0,8,0,0,0,2,0,0,3,6,1,8,0,0,0,2,3,0,0,0,0,0,0,6,0,0,0,0,0,0,3,8,0,0,0,6,9,2,1,0,0,8,0,0,0,7,0,0,0,0,7,0,1,5,0,0,9,0,4,0,0,0,0,0];
				case "level_708":
					return [0,2,7,0,1,0,0,0,0,0,0,0,0,0,5,0,7,0,6,0,8,0,0,4,0,3,0,0,0,2,3,0,0,0,0,0,3,4,0,7,0,9,0,5,6,0,0,0,0,0,6,3,0,0,0,8,0,4,0,0,6,0,3,0,1,0,6,0,0,0,0,0,0,0,0,0,3,0,2,4,0];
				case "level_709":
					return [0,0,5,8,1,0,0,0,0,7,2,0,0,0,0,0,0,0,0,0,4,0,0,0,3,0,6,0,8,0,6,4,2,0,9,7,0,0,0,0,0,0,0,0,0,6,5,0,7,8,9,0,3,0,5,0,7,0,0,0,1,0,0,0,0,0,0,0,0,0,4,5,0,0,0,0,9,6,7,0,0];
				case "level_710":
					return [0,0,0,1,0,6,3,0,0,7,1,0,0,0,4,0,0,5,6,0,0,0,2,0,0,4,0,5,8,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,1,8,0,6,0,0,3,0,0,0,9,3,0,0,8,0,0,0,5,2,0,0,8,7,0,1,0,0,0];
				case "level_711":
					return [0,0,0,0,0,2,1,0,0,0,4,0,0,3,6,0,0,0,9,0,0,0,7,0,6,0,5,4,0,5,0,0,0,0,6,0,0,0,1,0,5,0,7,0,0,0,3,0,0,0,0,2,0,8,6,0,4,0,8,0,0,0,3,0,0,0,1,6,0,0,8,0,0,0,9,3,0,0,0,0,0];
				case "level_712":
					return [3,0,0,0,7,0,0,5,4,0,0,4,0,1,8,0,0,0,0,0,0,0,0,5,0,9,0,0,7,0,0,0,3,0,0,0,1,0,8,0,9,0,2,0,3,0,0,0,8,0,0,0,6,0,0,2,0,7,0,0,0,0,0,0,0,0,3,6,0,4,0,0,9,1,0,0,8,0,0,0,7];
				case "level_713":
					return [0,0,0,1,0,0,9,7,0,4,9,6,2,0,0,0,8,0,0,0,0,0,0,0,0,0,6,0,0,0,3,2,0,0,0,4,0,5,0,0,1,0,0,9,0,2,0,0,0,5,7,0,0,0,5,0,0,0,0,0,0,0,0,0,6,0,0,0,4,1,2,3,0,8,3,0,0,2,0,0,0];
				case "level_714":
					return [0,0,8,0,0,0,5,0,9,0,0,0,7,0,8,0,6,0,0,0,4,9,0,0,0,1,0,0,0,0,3,0,7,0,0,4,5,0,0,6,0,2,0,0,7,2,0,0,4,0,9,0,0,0,0,9,0,0,0,4,1,0,0,0,3,0,2,0,1,0,0,0,1,0,6,0,0,0,9,0,0];
				case "level_715":
					return [0,0,0,0,0,0,8,0,0,8,0,0,0,2,1,7,3,0,0,4,3,0,6,0,0,0,0,4,0,0,0,0,7,0,9,3,5,0,0,0,0,0,0,0,8,3,6,0,5,0,0,0,0,1,0,0,0,0,5,0,4,6,0,0,2,8,3,4,0,0,0,5,0,0,4,0,0,0,0,0,0];
				case "level_716":
					return [0,5,0,3,0,0,8,0,4,0,0,2,7,0,0,3,0,0,0,1,0,0,0,8,0,0,0,0,0,0,0,0,4,0,0,6,0,2,9,0,3,0,4,7,0,6,0,0,9,0,0,0,0,0,0,0,0,8,0,0,0,4,0,0,0,4,0,0,1,9,0,0,7,0,1,0,0,9,0,3,0];
				case "level_717":
					return [0,0,0,0,8,0,0,9,7,1,0,0,7,0,3,0,0,0,0,2,0,0,0,6,0,1,0,0,0,0,0,0,0,6,0,0,3,9,0,0,0,0,0,5,4,0,0,4,0,0,0,0,0,0,0,7,0,5,0,0,0,3,0,0,0,0,9,0,1,0,0,2,8,6,0,0,7,0,0,0,0];
				case "level_718":
					return [0,4,0,7,0,0,0,5,3,0,0,7,8,0,2,0,0,0,9,0,0,0,4,0,0,6,0,0,0,4,0,0,0,0,7,2,0,0,0,0,0,0,0,0,0,7,3,0,0,0,0,9,0,0,0,9,0,0,5,0,0,0,1,0,0,0,2,0,9,4,0,0,2,8,0,0,0,1,0,3,0];
				case "level_719":
					return [0,0,0,2,0,0,0,0,0,2,0,7,0,6,0,0,0,3,9,6,0,0,0,4,2,0,5,0,1,0,0,0,0,6,0,0,0,8,0,0,1,0,0,5,0,0,0,2,0,0,0,0,7,0,6,0,8,4,0,0,0,3,9,4,0,0,0,9,0,7,0,2,0,0,0,0,0,7,0,0,0];
				case "level_720":
					return [0,0,0,0,0,0,0,0,0,5,1,0,0,0,0,0,9,4,0,0,3,1,9,0,0,0,0,0,8,9,0,4,0,0,0,6,0,0,4,0,3,0,2,0,0,7,0,0,0,8,0,5,4,0,0,0,0,0,2,3,9,0,0,4,7,0,0,0,0,0,5,1,0,0,0,0,0,0,0,0,0];
				case "level_721":
					return [0,0,0,0,5,6,0,0,0,5,9,2,0,0,0,0,0,0,0,1,6,0,2,0,0,0,8,0,0,0,6,1,0,0,2,0,0,0,9,2,0,3,7,0,0,0,6,0,0,9,5,0,0,0,6,0,0,0,4,0,8,5,0,0,0,0,0,0,0,6,4,1,0,0,0,7,6,0,0,0,0];
				case "level_722":
					return [0,6,0,0,7,0,9,0,0,0,0,0,8,0,0,0,1,2,0,0,3,0,2,0,0,5,0,0,8,0,0,6,0,0,0,7,0,0,4,7,0,8,5,0,0,7,0,0,0,1,0,0,6,0,0,5,0,0,3,0,4,0,0,9,4,0,0,0,2,0,0,0,0,0,8,0,4,0,0,9,0];
				case "level_723":
					return [5,6,0,0,7,0,0,0,2,0,0,0,1,4,0,8,0,0,0,9,0,2,0,0,0,0,0,0,0,0,7,0,0,0,4,0,6,0,7,0,5,0,9,0,1,0,2,0,0,0,1,0,0,0,0,0,0,0,0,3,0,5,0,0,0,8,0,6,7,0,0,0,1,0,0,0,2,0,0,3,8];
				case "level_724":
					return [0,1,0,0,3,0,0,0,0,0,0,9,0,7,0,1,0,0,0,0,0,5,0,0,8,0,6,0,0,0,0,0,7,0,4,8,0,5,4,0,6,0,9,2,0,9,7,0,4,0,0,0,0,0,3,0,2,0,0,9,0,0,0,0,0,6,0,2,0,7,0,0,0,0,0,0,4,0,0,1,0];
				case "level_725":
					return [6,1,0,0,0,3,0,0,0,9,0,0,0,0,0,1,2,7,0,0,0,9,1,0,0,0,5,5,0,2,0,8,0,0,0,0,0,4,0,0,0,0,0,8,0,0,0,0,0,5,0,3,0,9,3,0,0,0,4,6,0,0,0,4,2,8,0,0,0,0,0,6,0,0,0,2,0,0,0,5,3];
				case "level_726":
					return [6,0,0,0,0,0,2,1,3,9,7,0,0,0,1,0,0,0,0,0,0,6,3,0,0,0,9,4,0,9,0,7,0,0,0,0,0,2,0,0,0,0,0,3,0,0,0,0,0,2,0,1,0,7,7,0,0,0,5,4,0,0,0,0,0,0,9,0,0,0,5,6,8,1,5,0,0,0,0,0,4];
				case "level_727":
					return [8,0,0,3,0,1,0,6,0,4,9,0,8,0,0,0,0,0,0,0,3,0,2,0,7,0,0,0,5,0,6,1,0,0,0,0,0,6,0,0,0,0,0,5,0,0,0,0,0,5,9,0,7,0,0,0,6,0,7,0,4,0,0,0,0,0,0,0,8,0,9,7,0,7,0,5,0,6,0,0,2];
				case "level_728":
					return [8,2,0,6,1,0,0,0,3,0,0,0,0,2,0,0,0,0,0,0,0,0,0,3,0,4,7,0,0,0,0,7,0,1,0,4,0,8,0,0,0,0,0,3,0,4,0,9,0,6,0,0,0,0,1,6,0,2,0,0,0,0,0,0,0,0,0,5,0,0,0,0,7,0,0,0,3,8,0,5,9];
				case "level_729":
					return [6,0,0,1,3,0,0,0,0,9,0,5,0,0,0,8,0,6,0,0,4,0,0,5,0,0,3,0,5,0,0,0,0,0,0,8,0,0,6,0,1,0,9,0,0,8,0,0,0,0,0,0,4,0,5,0,0,6,0,0,4,0,0,2,0,7,0,0,0,5,0,9,0,0,0,0,2,4,0,0,7];
				case "level_730":
					return [0,7,8,0,2,0,0,0,0,0,0,0,0,0,9,7,0,0,3,0,0,0,7,0,6,0,8,1,0,3,0,0,7,0,6,0,0,0,0,0,8,0,0,0,0,0,6,0,3,0,0,8,0,2,7,0,1,0,3,0,0,0,5,0,0,2,9,0,0,0,0,0,0,0,0,0,5,0,4,1,0];
				case "level_731":
					return [0,0,0,0,6,0,8,0,0,0,0,9,0,0,0,4,0,5,5,0,0,0,8,0,0,9,0,2,0,0,0,0,9,0,0,0,7,1,0,0,4,0,0,5,3,0,0,0,7,0,0,0,0,2,0,6,0,0,7,0,0,0,1,3,0,8,0,0,0,6,0,0,0,0,2,0,3,0,0,0,0];
				case "level_732":
					return [0,1,3,0,6,0,0,0,2,0,0,0,0,0,1,0,8,7,0,0,0,0,8,0,0,1,0,0,2,6,0,5,8,0,0,0,9,0,0,0,0,0,0,0,1,0,0,0,1,3,0,8,2,0,0,8,0,0,1,0,0,0,0,3,4,0,7,0,0,0,0,0,7,0,0,0,2,0,9,4,0];
				case "level_733":
					return [0,3,0,0,6,0,0,0,9,0,4,6,0,0,8,0,0,0,7,0,0,0,5,0,0,2,0,0,0,5,0,2,0,0,8,0,3,0,0,8,0,5,0,0,1,0,2,0,0,4,0,5,0,0,0,7,0,0,1,0,0,0,8,0,0,0,6,0,0,7,1,0,1,0,0,0,9,0,0,3,0];
				case "level_734":
					return [0,0,4,5,0,0,0,0,0,5,0,3,0,7,0,0,0,0,0,9,0,3,0,0,0,5,0,7,0,6,0,0,0,0,0,3,2,0,0,4,0,7,0,0,8,4,0,0,0,0,0,1,0,7,0,4,0,0,0,6,0,3,0,0,0,0,0,5,0,7,0,2,0,0,0,0,0,8,4,0,0];
				case "level_735":
					return [0,0,0,0,9,2,0,1,0,0,2,9,0,0,8,0,0,0,0,0,1,0,5,0,0,6,0,8,0,0,5,0,0,0,0,1,0,7,0,0,1,0,0,9,0,1,0,0,0,0,7,0,0,3,0,6,0,0,8,0,4,0,0,0,0,0,7,0,0,3,8,0,0,5,0,4,3,0,0,0,0];
				case "level_736":
					return [0,7,0,0,0,2,0,0,0,1,0,9,0,4,0,0,0,0,0,0,4,0,0,8,0,2,9,0,0,0,0,8,0,7,0,0,0,4,0,3,9,5,0,8,0,0,0,3,0,1,0,0,0,0,7,6,0,8,0,0,2,0,0,0,0,0,0,6,0,3,0,8,0,0,0,5,0,0,0,1,0];
				case "level_737":
					return [8,1,0,0,0,4,0,0,0,0,0,6,0,1,0,0,8,0,0,2,0,0,3,0,1,0,0,9,0,0,0,7,0,0,5,0,0,0,1,9,0,6,2,0,0,0,6,0,0,5,0,0,0,9,0,0,3,0,4,0,0,2,0,0,5,0,0,9,0,8,0,0,0,0,0,6,0,0,0,7,4];
				case "level_738":
					return [9,0,0,2,0,5,0,0,8,0,6,0,0,0,7,0,0,0,3,0,0,1,0,0,2,0,0,0,8,0,6,0,0,1,0,0,0,3,0,0,0,0,0,4,0,0,0,7,0,0,8,0,3,0,0,0,3,0,0,9,0,0,4,0,0,0,5,0,0,0,8,0,7,0,0,8,0,6,0,0,5];
				case "level_739":
					return [0,0,0,0,0,8,0,6,9,2,3,0,7,4,0,0,0,8,0,0,0,0,3,0,0,0,0,0,0,0,0,9,0,4,0,6,0,2,0,0,0,0,0,8,0,6,0,5,0,7,0,0,0,0,0,0,0,0,1,0,0,0,0,9,0,0,0,8,2,0,1,5,4,7,0,3,0,0,0,0,0];
				case "level_740":
					return [5,8,0,0,4,0,0,7,0,4,0,0,0,0,0,0,1,0,0,0,9,3,0,0,0,2,0,0,0,0,0,0,5,0,3,7,0,0,0,7,1,6,0,0,0,1,7,0,2,0,0,0,0,0,0,3,0,0,0,7,6,0,0,0,9,0,0,0,0,0,0,2,0,4,0,0,6,0,0,9,8];
				case "level_741":
					return [0,6,0,3,2,0,0,0,0,3,0,0,0,0,1,0,6,0,0,0,0,0,0,9,8,0,4,8,4,0,0,0,0,0,7,0,0,0,1,0,9,0,5,0,0,0,9,0,0,0,0,0,8,6,2,0,6,9,0,0,0,0,0,0,1,0,5,0,0,0,0,3,0,0,0,0,3,7,0,9,0];
				case "level_742":
					return [0,0,0,3,5,0,4,0,0,4,9,0,0,8,0,0,0,6,0,1,0,9,0,0,0,0,0,0,0,0,6,0,0,0,8,0,6,0,7,0,1,0,3,0,5,0,2,0,0,0,3,0,0,0,0,0,0,0,0,8,0,7,0,8,0,0,0,3,0,0,5,1,0,0,4,0,2,6,0,0,0];
				case "level_743":
					return [0,3,0,0,4,0,1,0,0,0,0,6,0,8,0,0,5,0,0,0,0,9,0,0,0,2,8,0,9,0,0,3,0,0,0,4,0,0,7,4,0,9,5,0,0,4,0,0,0,2,0,0,3,0,1,7,0,0,0,8,0,0,0,0,5,0,0,6,0,7,0,0,0,0,9,0,7,0,0,1,0];
				case "level_744":
					return [6,0,0,0,0,0,0,0,4,0,0,2,5,1,6,0,0,0,0,8,5,3,0,0,0,0,0,9,1,0,0,5,0,0,0,0,0,0,4,0,0,0,5,0,0,0,0,0,0,8,0,0,4,6,0,0,0,0,0,9,6,8,0,0,0,0,8,2,5,4,0,0,8,0,0,0,0,0,0,0,7];
				case "level_745":
					return [7,0,0,0,6,0,2,0,8,8,0,0,0,0,0,9,0,0,3,0,0,0,0,4,0,6,0,4,0,5,9,0,0,0,0,0,0,0,0,4,5,6,0,0,0,0,0,0,0,0,1,4,0,3,0,8,0,3,0,0,0,0,9,0,0,7,0,0,0,0,0,5,2,0,1,0,7,0,0,0,4];
				case "level_746":
					return [0,6,0,0,8,1,0,0,0,7,0,0,0,0,0,6,0,0,0,0,2,0,7,0,0,9,0,6,0,1,0,0,7,0,4,0,0,3,7,0,0,0,9,1,0,0,4,0,5,0,0,7,0,3,0,1,0,0,5,0,2,0,0,0,0,8,0,0,0,0,0,9,0,0,0,1,4,0,0,6,0];
				case "level_747":
					return [0,0,0,0,1,0,2,0,9,0,0,8,0,0,0,0,0,0,2,0,6,3,5,0,0,8,0,4,2,0,6,0,0,0,9,0,0,8,0,0,0,0,0,7,0,0,3,0,0,0,7,0,2,1,0,7,0,0,9,2,8,0,5,0,0,0,0,0,0,9,0,0,1,0,9,0,7,0,0,0,0];
				case "level_748":
					return [0,0,1,0,6,0,0,7,0,0,0,0,8,0,0,0,0,0,0,6,4,1,0,0,0,2,0,0,0,6,0,0,0,0,9,0,3,8,0,4,0,5,0,6,7,0,5,0,0,0,0,3,0,0,0,9,0,0,0,1,8,4,0,0,0,0,0,0,2,0,0,0,0,3,0,0,9,0,5,0,0];
				case "level_749":
					return [0,0,0,0,2,0,3,0,8,0,0,0,5,0,0,0,1,0,0,1,0,0,6,3,0,0,5,3,0,6,0,5,0,0,0,9,0,0,0,0,0,0,0,0,0,7,0,0,0,3,0,5,0,1,8,0,0,3,9,0,0,4,0,0,7,0,0,0,8,0,0,0,2,0,3,0,7,0,0,0,0];
				case "level_750":
					return [0,8,0,0,1,6,0,0,0,0,0,3,0,2,0,0,7,0,2,0,0,0,0,0,8,0,0,8,0,6,0,0,2,0,9,0,0,5,2,0,0,0,7,6,0,0,9,0,4,0,0,2,0,5,0,0,1,0,0,0,0,0,7,0,6,0,0,4,0,3,0,0,0,0,0,6,9,0,0,8,0];
				case "level_751":
					return [0,9,8,0,0,0,0,3,0,4,2,3,1,0,0,0,0,0,0,0,0,0,0,0,4,5,0,7,0,0,0,2,5,9,0,0,0,0,0,0,0,0,0,0,0,0,0,5,3,1,0,0,0,8,0,6,4,0,0,0,0,0,0,0,0,0,0,0,4,7,9,6,0,7,0,0,0,0,1,4,0];
				case "level_752":
					return [0,0,0,0,0,0,0,0,0,0,0,1,0,0,3,0,8,6,3,0,8,5,9,0,0,2,0,0,0,2,0,0,0,0,9,0,0,0,6,3,0,1,7,0,0,0,3,0,0,0,0,1,0,0,0,8,0,0,7,9,2,0,4,4,7,0,2,0,0,5,0,0,0,0,0,0,0,0,0,0,0];
				case "level_753":
					return [0,9,0,0,0,0,0,7,5,0,0,0,8,0,0,2,0,0,0,1,0,0,2,9,0,0,0,2,3,6,0,0,0,0,0,0,0,4,0,0,0,0,0,1,0,0,0,0,0,0,0,6,5,8,0,0,0,7,3,0,0,2,0,0,0,1,0,0,5,0,0,0,3,6,0,0,0,0,0,4,0];
				case "level_754":
					return [0,0,5,0,0,2,8,0,0,0,0,0,4,0,1,0,0,9,0,2,0,0,6,0,0,3,0,0,4,0,9,0,0,6,0,0,9,0,0,0,0,0,0,0,4,0,0,3,0,0,6,0,9,0,0,3,0,0,1,0,0,2,0,7,0,0,3,0,4,0,0,0,0,0,6,2,0,0,3,0,0];
				case "level_755":
					return [5,0,1,0,0,8,4,0,0,0,0,0,1,2,0,0,7,0,0,0,0,0,6,0,0,0,8,0,0,0,3,0,0,0,4,0,0,3,7,0,0,0,2,6,0,0,6,0,0,0,2,0,0,0,9,0,0,0,8,0,0,0,0,0,1,0,0,9,3,0,0,0,0,0,6,4,0,0,5,0,9];
				case "level_756":
					return [0,0,1,8,0,0,9,0,0,6,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,7,8,0,3,5,1,0,8,0,0,0,4,0,0,0,6,0,0,0,3,0,0,0,4,0,7,1,2,0,9,4,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,2,0,0,7,0,0,4,3,0,0];
				case "level_757":
					return [0,0,0,0,4,8,0,5,1,0,3,0,0,0,0,0,0,7,1,9,0,7,0,0,0,0,0,0,8,0,0,7,0,0,0,2,9,0,0,0,0,0,0,0,6,6,0,0,0,5,0,0,7,0,0,0,0,0,0,6,0,1,8,3,0,0,0,0,0,0,4,0,8,2,0,5,9,0,0,0,0];
				case "level_758":
					return [0,0,0,2,0,0,0,3,0,0,0,0,0,0,6,8,0,7,0,0,0,9,0,0,4,0,5,0,0,7,0,9,0,1,0,8,0,0,5,0,0,0,6,0,0,9,0,6,0,8,0,7,0,0,8,0,1,0,0,3,0,0,0,2,0,4,5,0,0,0,0,0,0,5,0,0,0,7,0,0,0];
				case "level_759":
					return [0,0,0,0,0,9,0,3,1,9,0,0,0,0,0,0,2,0,1,8,0,7,6,0,0,0,0,5,0,0,0,9,0,0,7,0,4,0,0,0,0,0,0,0,3,0,9,0,0,8,0,0,0,4,0,0,0,0,3,8,0,5,7,0,6,0,0,0,0,0,0,2,7,1,0,4,0,0,0,0,0];
				case "level_760":
					return [1,0,3,7,0,0,0,0,6,9,6,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,2,0,9,6,4,0,0,0,8,0,0,0,2,0,0,0,5,2,3,0,1,0,0,0,0,3,0,0,0,7,0,0,0,0,0,0,0,0,0,0,7,4,5,0,0,0,0,2,1,0,9];
				case "level_761":
					return [0,0,7,0,0,3,0,0,0,0,9,0,0,0,0,0,0,2,3,4,0,0,0,2,0,0,0,0,0,0,0,4,5,9,0,0,4,7,0,0,1,0,0,6,8,0,0,8,7,3,0,0,0,0,0,0,0,9,0,0,0,7,6,2,0,0,0,0,0,0,8,0,0,0,0,5,0,0,1,0,0];
				case "level_762":
					return [0,0,5,0,0,0,8,0,0,6,0,8,0,0,7,2,0,5,0,0,0,3,0,0,0,7,0,0,0,0,9,0,0,4,0,8,0,0,0,7,0,4,0,0,0,8,0,4,0,0,3,0,0,0,0,4,0,0,0,2,0,0,0,7,0,2,4,0,0,1,0,6,0,0,6,0,0,0,5,0,0];
				case "level_763":
					return [0,0,0,1,2,8,5,0,4,0,0,0,0,0,6,7,0,3,0,0,0,0,0,0,0,2,0,0,3,6,0,0,0,0,0,2,0,0,0,6,0,7,0,0,0,8,0,0,0,0,0,9,1,0,0,9,0,0,0,0,0,0,0,1,0,2,7,0,0,0,0,0,7,0,4,5,8,1,0,0,0];
				case "level_764":
					return [6,0,0,0,0,4,0,0,0,0,0,4,1,0,3,5,0,0,3,0,0,2,0,0,0,1,0,4,0,5,0,0,0,0,0,2,0,0,1,0,0,0,6,0,0,2,0,0,0,0,0,8,0,5,0,4,0,0,0,5,0,0,3,0,0,9,4,0,8,2,0,0,0,0,0,3,0,0,0,0,9];
				case "level_765":
					return [8,0,0,0,0,0,0,7,0,0,0,0,1,0,0,4,0,0,0,0,0,3,0,0,0,2,5,0,0,7,2,9,0,0,0,0,6,2,0,0,4,0,0,5,7,0,0,0,0,6,1,3,0,0,9,6,0,0,0,8,0,0,0,0,0,2,0,0,9,0,0,0,0,3,0,0,0,0,0,0,8];
				case "level_766":
					return [8,0,0,0,0,1,0,0,0,0,0,0,0,0,0,5,2,0,5,0,0,0,6,0,0,0,7,0,0,5,3,0,0,4,0,0,1,4,0,0,8,0,0,7,2,0,0,8,0,0,7,9,0,0,6,0,0,0,2,0,0,0,9,0,3,1,0,0,0,0,0,0,0,0,0,8,0,0,0,0,1];
				case "level_767":
					return [0,0,0,0,6,2,1,0,3,5,0,0,0,0,0,8,0,0,9,0,1,8,0,0,0,0,0,2,0,0,0,8,0,4,0,0,0,0,9,0,0,0,7,0,0,0,0,7,0,3,0,0,0,8,0,0,0,0,0,7,2,0,1,0,0,5,0,0,0,0,0,6,4,0,2,3,9,0,0,0,0];
				case "level_768":
					return [0,6,0,0,0,5,7,0,0,8,3,0,0,1,0,0,0,0,0,0,2,0,9,0,0,4,0,0,0,0,0,0,3,0,0,1,2,0,3,0,0,0,9,0,8,5,0,0,9,0,0,0,0,0,0,4,0,0,7,0,1,0,0,0,0,0,0,5,0,0,2,4,0,0,5,1,0,0,0,7,0];
				case "level_769":
					return [8,5,0,0,0,0,1,0,3,0,0,0,5,0,8,9,0,0,0,6,0,0,0,0,8,0,0,0,0,0,1,0,0,0,4,0,0,0,6,0,0,0,3,0,0,0,7,0,0,0,9,0,0,0,0,0,1,0,0,0,0,9,0,0,0,7,2,0,6,0,0,0,4,0,3,0,0,0,0,7,1];
				case "level_770":
					return [0,0,7,0,5,0,0,0,0,0,4,0,6,1,0,0,2,0,0,0,3,0,0,7,0,0,0,8,0,0,5,0,0,3,0,0,4,6,0,0,0,0,0,7,2,0,0,5,0,0,1,0,0,4,0,0,0,7,0,0,6,0,0,0,1,0,0,8,6,0,9,0,0,0,0,0,2,0,8,0,0];
				case "level_771":
					return [0,0,1,0,3,0,0,5,0,0,0,0,5,9,0,0,0,7,0,7,0,0,0,0,1,0,6,0,0,8,2,0,0,0,0,0,5,3,0,0,0,0,0,1,8,0,0,0,0,0,3,5,0,0,2,0,4,0,0,0,0,7,0,9,0,0,0,6,8,0,0,0,0,6,0,0,2,0,8,0,0];
				case "level_772":
					return [7,2,0,5,3,0,1,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,7,3,2,0,9,0,0,0,0,0,4,0,0,3,0,0,9,0,4,0,0,8,0,0,5,0,0,0,0,0,7,0,8,1,4,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,7,0,5,6,0,4,1];
				case "level_773":
					return [0,0,0,3,0,0,2,0,0,4,0,0,0,5,8,0,0,6,0,0,0,0,7,0,3,0,0,0,0,2,0,0,7,0,1,0,3,4,0,0,0,0,0,6,8,0,6,0,5,0,0,7,0,0,0,0,1,0,4,0,0,0,0,9,0,0,8,1,0,0,0,5,0,0,8,0,0,3,0,0,0];
				case "level_774":
					return [0,0,2,0,0,0,0,9,0,3,0,0,0,6,0,0,0,1,0,0,0,0,3,5,0,2,0,0,0,0,0,0,0,0,3,0,4,7,1,0,8,0,5,6,2,0,6,0,0,0,0,0,0,0,0,5,0,8,4,0,0,0,0,9,0,0,0,5,0,0,0,8,0,3,0,0,0,0,4,0,0];
				case "level_775":
					return [0,0,6,5,0,0,0,0,0,0,5,0,0,8,0,2,0,0,8,0,0,2,0,0,0,0,6,3,0,2,0,0,0,0,0,4,0,0,8,1,0,4,7,0,0,6,0,0,0,0,0,5,0,3,1,0,0,0,0,3,0,0,7,0,0,5,0,7,0,0,8,0,0,0,0,0,0,1,4,0,0];
				case "level_776":
					return [0,0,7,4,0,0,0,0,0,5,1,0,0,0,3,0,0,0,0,0,0,0,1,7,3,0,0,0,0,0,0,0,2,7,4,0,1,0,0,0,3,0,0,0,2,0,4,2,9,0,0,0,0,0,0,0,5,8,2,0,0,0,0,0,0,0,7,0,0,0,6,4,0,0,0,0,0,1,5,0,0];
				case "level_777":
					return [0,1,0,2,0,0,0,9,0,4,0,0,9,0,0,0,0,0,0,0,6,0,1,0,0,0,8,8,2,0,0,0,0,0,7,0,1,0,0,4,0,9,0,0,6,0,4,0,0,0,0,0,2,5,5,0,0,0,6,0,8,0,0,0,0,0,0,0,8,0,0,7,0,7,0,0,0,5,0,6,0];
				case "level_778":
					return [0,3,0,0,6,0,0,0,0,5,0,0,7,0,0,0,3,0,0,0,0,3,0,4,9,6,0,2,0,0,0,0,1,0,0,5,0,0,9,0,0,0,7,0,0,3,0,0,4,0,0,0,0,8,0,5,4,9,0,7,0,0,0,0,1,0,0,0,3,0,0,9,0,0,0,0,4,0,0,5,0];
				case "level_779":
					return [0,0,6,0,3,0,0,5,0,0,0,9,0,0,5,0,0,0,2,0,0,0,0,4,0,0,3,0,0,0,6,0,9,0,7,1,0,0,0,0,8,0,0,0,0,6,2,0,4,0,1,0,0,0,4,0,0,7,0,0,0,0,9,0,0,0,3,0,0,1,0,0,0,8,0,0,1,0,2,0,0];
				case "level_780":
					return [0,0,5,0,7,2,0,0,6,0,9,0,6,0,1,0,7,0,0,0,0,0,0,0,5,0,0,0,0,0,0,9,0,0,2,5,0,0,4,0,0,0,7,0,0,9,1,0,0,8,0,0,0,0,0,0,7,0,0,0,0,0,0,0,4,0,1,0,8,0,6,0,8,0,0,5,4,0,2,0,0];
				case "level_781":
					return [0,0,0,0,6,9,0,0,3,0,0,0,0,0,7,1,0,9,4,0,0,0,3,0,6,0,0,0,1,0,0,0,0,0,6,0,8,0,7,0,0,0,5,0,4,0,5,0,0,0,0,0,3,0,0,0,2,0,1,0,0,0,7,1,0,8,5,0,0,0,0,0,9,0,0,3,2,0,0,0,0];
				case "level_782":
					return [0,0,0,4,0,7,0,0,0,8,0,4,0,3,0,0,0,0,5,2,0,0,0,0,0,0,0,0,4,0,0,8,0,0,0,6,0,0,9,1,7,5,3,0,0,7,0,0,0,6,0,0,2,0,0,0,0,0,0,0,0,5,8,0,0,0,0,1,0,2,0,3,0,0,0,3,0,9,0,0,0];
				case "level_783":
					return [0,9,0,0,1,0,0,5,0,0,0,7,0,0,0,0,2,0,6,0,0,9,4,0,0,0,0,0,7,0,0,0,1,0,0,3,1,0,4,0,0,0,7,0,2,8,0,0,3,0,0,0,9,0,0,0,0,0,3,4,0,0,8,0,5,0,0,0,0,2,0,0,0,8,0,0,6,0,0,4,0];
				case "level_784":
					return [0,0,0,5,6,0,8,0,0,4,0,0,0,0,3,0,0,0,0,6,7,0,0,0,9,0,0,0,0,0,0,0,0,3,1,7,0,0,9,0,0,0,4,0,0,7,8,6,0,0,0,0,0,0,0,0,2,0,0,0,5,3,0,0,0,0,1,0,0,0,0,8,0,0,4,8,2,0,0,0,0];
				case "level_785":
					return [0,5,0,0,6,0,0,7,0,0,0,0,0,0,0,0,0,2,0,0,1,2,0,0,0,9,0,5,0,0,0,0,3,4,2,0,0,0,0,8,0,7,0,0,0,0,3,8,4,0,0,0,0,1,0,4,0,0,0,8,3,0,0,6,0,0,0,0,0,0,0,0,0,7,0,0,9,0,0,4,0];
				case "level_786":
					return [0,0,0,0,2,0,0,8,0,0,1,0,0,0,4,3,0,0,2,8,0,3,0,9,0,0,0,0,0,4,2,0,0,5,0,0,3,0,0,0,0,0,0,0,9,0,0,6,0,0,1,8,0,0,0,0,0,4,0,2,0,7,3,0,0,8,9,0,0,0,4,0,0,4,0,0,7,0,0,0,0];
				case "level_787":
					return [0,0,0,0,1,0,0,5,0,0,0,7,0,6,0,3,0,0,6,8,0,4,2,0,0,0,0,1,0,0,0,0,0,0,0,0,4,0,2,0,3,0,1,0,5,0,0,0,0,0,0,0,0,3,0,0,0,0,9,2,0,4,1,0,0,4,0,5,0,8,0,0,0,6,0,0,7,0,0,0,0];
				case "level_788":
					return [0,5,7,0,9,0,0,0,0,2,8,0,0,3,0,1,0,0,0,0,0,7,0,2,0,0,0,8,1,0,0,0,0,0,0,0,7,0,2,0,0,0,5,0,6,0,0,0,0,0,0,0,9,2,0,0,0,5,0,9,0,0,0,0,0,3,0,4,0,0,5,8,0,0,0,0,1,0,6,4,0];
				case "level_789":
					return [4,0,0,0,8,6,0,0,0,6,0,0,0,0,0,9,0,5,0,0,0,2,0,0,0,8,0,1,7,8,0,0,0,0,0,0,3,0,0,0,0,0,0,0,4,0,0,0,0,0,0,2,7,9,0,4,0,0,0,9,0,0,0,7,0,1,0,0,0,0,0,3,0,0,0,5,1,0,0,0,8];
				case "level_790":
					return [0,0,0,3,0,0,0,0,8,0,0,0,0,8,0,7,6,0,0,0,0,9,0,4,0,2,3,7,0,0,2,0,0,4,0,0,8,0,0,0,0,0,0,0,5,0,0,4,0,0,9,0,0,1,2,5,0,4,0,7,0,0,0,0,6,7,0,5,0,0,0,0,4,0,0,0,0,3,0,0,0];
				case "level_791":
					return [0,0,0,9,0,0,0,8,5,0,0,0,0,0,4,2,0,0,0,0,2,7,6,0,0,0,0,8,0,6,3,0,0,0,0,0,0,4,0,0,1,0,0,6,0,0,0,0,0,0,6,9,0,8,0,0,0,0,4,9,1,0,0,0,0,9,8,0,0,0,0,0,4,2,0,0,0,1,0,0,0];
				case "level_792":
					return [6,0,4,5,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,4,1,0,5,0,0,4,3,0,0,0,7,0,0,5,8,0,0,0,0,0,0,0,3,1,0,0,9,0,0,0,4,6,0,0,7,0,5,8,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,6,9,0,4];
				case "level_793":
					return [0,0,9,0,0,0,0,7,5,0,0,0,5,0,0,0,0,0,0,5,0,7,0,6,8,0,4,0,0,0,0,3,0,0,0,1,7,0,1,0,0,0,5,0,2,8,0,0,0,4,0,0,0,0,5,0,8,3,0,4,0,9,0,0,0,0,0,0,2,0,0,0,1,7,0,0,0,0,3,0,0];
				case "level_794":
					return [0,6,2,0,0,0,0,5,0,1,9,5,6,0,0,0,0,0,0,0,0,0,0,0,6,1,0,3,0,0,0,2,7,8,0,0,0,0,0,0,0,0,0,0,0,0,0,9,8,4,0,0,0,5,0,8,6,0,0,0,0,0,0,0,0,0,0,0,2,7,4,6,0,7,0,0,0,0,3,9,0];
				case "level_795":
					return [0,7,0,0,0,0,0,4,0,4,9,0,6,0,0,0,7,1,0,0,6,0,0,2,0,0,0,7,8,0,0,0,5,0,0,0,0,0,0,8,0,6,0,0,0,0,0,0,2,0,0,0,8,7,0,0,0,9,0,0,8,0,0,1,3,0,0,0,8,0,9,6,0,4,0,0,0,0,0,1,0];
				case "level_796":
					return [0,7,4,0,0,3,0,0,0,0,0,0,0,0,0,0,7,0,2,6,3,0,0,7,0,4,0,8,0,0,0,3,4,0,0,0,0,0,6,0,0,0,9,0,0,0,0,0,1,7,0,0,0,8,0,1,0,7,0,0,6,9,5,0,2,0,0,0,0,0,0,0,0,0,0,5,0,0,8,2,0];
				case "level_797":
					return [0,0,0,5,0,0,2,0,3,0,8,9,0,0,0,0,0,0,0,0,2,0,6,0,0,4,0,4,0,0,0,9,3,0,7,0,0,0,6,0,0,0,5,0,0,0,7,0,6,5,0,0,0,8,0,9,0,0,2,0,7,0,0,0,0,0,0,0,0,3,6,0,1,0,8,0,0,5,0,0,0];
				case "level_798":
					return [0,0,6,0,1,0,0,0,0,0,8,0,5,0,0,3,0,0,0,0,0,4,0,8,6,0,1,0,2,0,0,0,1,0,5,0,4,0,0,0,0,0,0,0,8,0,6,0,3,0,0,0,9,0,8,0,7,1,0,5,0,0,0,0,0,5,0,0,4,0,6,0,0,0,0,0,7,0,5,0,0];
				case "level_799":
					return [0,0,8,0,3,0,1,0,0,0,5,0,4,1,0,0,0,0,0,6,0,0,0,0,0,0,5,0,1,0,0,0,0,0,0,0,4,3,5,0,9,0,7,2,8,0,0,0,0,0,0,0,3,0,7,0,0,0,0,0,0,1,0,0,0,0,0,7,9,0,4,0,0,0,9,0,4,0,6,0,0];
				case "level_800":
					return [0,0,8,5,0,0,2,4,7,0,0,0,7,0,0,6,1,0,0,0,6,0,0,0,0,0,0,0,0,0,8,5,0,0,0,1,0,4,0,0,0,0,0,2,0,1,0,0,0,9,3,0,0,0,0,0,0,0,0,0,5,0,0,0,3,5,0,0,9,0,0,0,6,9,4,0,0,5,3,0,0];
				case "level_801":
					return [0,1,0,0,5,0,2,0,0,5,0,0,4,0,0,8,0,0,0,0,8,0,0,0,0,3,0,0,0,0,0,0,4,0,0,0,1,0,5,6,3,2,9,0,8,0,0,0,8,0,0,0,0,0,0,6,0,0,0,0,4,0,0,0,0,9,0,0,1,0,0,7,0,0,3,0,7,0,0,1,0];
				case "level_802":
					return [0,1,7,0,0,0,0,0,0,0,0,4,0,0,0,8,5,0,0,0,0,0,0,2,9,4,1,0,8,0,7,9,0,0,0,6,0,0,0,0,0,0,0,0,0,5,0,0,0,2,4,0,7,0,3,6,8,1,0,0,0,0,0,0,2,1,0,0,0,6,0,0,0,0,0,0,0,0,3,1,0];
				case "level_803":
					return [0,0,0,8,0,0,6,0,3,0,0,7,9,0,0,5,8,4,0,0,6,0,0,0,0,0,0,0,0,0,7,9,0,0,3,0,4,0,0,0,0,0,0,0,5,0,3,0,0,2,1,0,0,0,0,0,0,0,0,0,9,0,0,2,6,4,0,0,9,1,0,0,1,0,9,0,0,2,0,0,0];
				case "level_804":
					return [0,0,3,0,7,1,0,0,0,0,9,8,0,0,0,2,0,0,0,6,0,0,0,2,0,0,3,8,0,5,1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,8,1,0,5,1,0,0,4,0,0,0,5,0,0,0,6,0,0,0,9,4,0,0,0,0,6,1,0,8,0,0];
				case "level_805":
					return [2,0,0,0,0,6,4,1,0,0,0,0,0,0,0,0,0,0,4,6,0,5,9,0,8,0,0,8,0,0,0,0,0,9,0,0,1,0,0,6,0,2,0,0,7,0,0,6,0,0,0,0,0,2,0,0,4,0,7,9,0,3,8,0,0,0,0,0,0,0,0,0,0,3,7,8,0,0,0,0,5];
				case "level_806":
					return [0,0,0,0,7,0,5,0,0,1,0,0,5,0,0,0,0,9,0,9,0,0,0,8,0,3,0,0,0,7,8,0,0,4,1,0,4,0,0,0,0,0,0,0,8,0,1,9,0,0,5,7,0,0,0,8,0,9,0,0,0,2,0,9,0,0,0,0,7,0,0,1,0,0,6,0,5,0,0,0,0];
				case "level_807":
					return [0,1,0,0,0,5,9,0,0,0,0,6,7,0,0,0,0,4,0,0,0,0,1,0,0,6,0,7,4,0,0,0,0,0,3,0,1,0,0,0,7,0,0,0,8,0,8,0,0,0,0,0,7,1,0,3,0,0,8,0,0,0,0,6,0,0,0,0,2,3,0,0,0,0,2,4,0,0,0,9,0];
				case "level_808":
					return [0,0,0,8,0,0,0,3,0,0,0,4,0,0,0,7,0,0,5,0,7,0,0,3,2,0,4,0,0,0,6,0,0,1,0,7,0,0,0,3,0,1,0,0,0,7,0,1,0,0,8,0,0,0,3,0,2,1,0,0,9,0,5,0,0,5,0,0,0,4,0,0,0,1,0,0,0,2,0,0,0];
				case "level_809":
					return [0,0,3,9,0,0,0,0,0,0,7,5,0,0,8,0,0,6,0,6,8,0,0,0,0,1,4,0,0,6,0,0,4,0,0,0,0,0,0,7,0,2,0,0,0,0,0,0,1,0,0,7,0,0,3,5,0,0,0,0,2,8,0,6,0,0,4,0,0,1,9,0,0,0,0,0,0,5,6,0,0];
				case "level_810":
					return [0,0,0,2,0,0,0,1,0,5,0,0,0,0,6,0,0,0,0,4,8,5,0,0,2,0,0,0,0,0,1,8,0,0,9,0,0,0,7,0,0,0,4,0,0,0,5,0,0,9,2,0,0,0,0,0,3,0,0,1,8,2,0,0,0,0,3,0,0,0,0,7,0,6,0,0,0,9,0,0,0];
				case "level_811":
					return [2,0,0,0,9,0,0,0,0,6,0,0,0,0,2,0,0,0,0,1,0,4,5,0,0,3,0,0,0,7,9,0,0,0,0,6,0,4,1,0,0,0,3,2,0,9,0,0,0,0,5,1,0,0,0,5,0,0,7,4,0,8,0,0,0,0,2,0,0,0,0,4,0,0,0,0,3,0,0,0,7];
				case "level_812":
					return [8,0,0,0,0,4,2,0,0,0,7,0,8,0,1,0,3,0,0,0,0,2,0,0,7,0,0,0,0,3,0,0,0,4,1,0,0,6,0,0,0,0,0,5,0,0,4,8,0,0,0,3,0,0,0,0,5,0,0,8,0,0,0,0,8,0,6,0,2,0,4,0,0,0,2,3,0,0,0,0,6];
				case "level_813":
					return [0,0,4,0,0,0,0,5,0,0,2,0,0,8,0,1,0,0,0,5,0,0,0,6,0,0,8,0,0,0,6,0,0,0,0,0,5,7,0,2,4,9,0,8,1,0,0,0,0,0,5,0,0,0,3,0,0,1,0,0,0,7,0,0,0,1,0,3,0,0,4,0,0,6,0,0,0,0,9,0,0];
				case "level_814":
					return [0,8,0,5,0,0,0,0,0,3,0,5,0,1,0,0,0,0,0,0,1,0,8,4,0,7,0,0,9,0,0,0,0,7,0,8,5,0,0,0,0,0,0,0,2,1,0,2,0,0,0,0,9,0,0,3,0,4,9,0,1,0,0,0,0,0,0,2,0,9,0,4,0,0,0,0,0,5,0,3,0];
				case "level_815":
					return [5,0,7,0,0,0,1,3,0,0,0,0,0,1,0,4,8,0,0,0,0,0,0,8,2,0,0,0,9,5,7,0,0,0,0,0,0,0,0,9,0,5,0,0,0,0,0,0,0,0,6,5,2,0,0,0,3,8,0,0,0,0,0,0,7,9,0,4,0,0,0,0,0,5,4,0,0,0,6,0,3];
				case "level_816":
					return [5,0,0,0,3,6,0,9,0,0,7,0,0,0,0,0,5,0,0,0,9,4,2,0,0,0,0,2,0,1,6,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,8,3,0,6,0,0,0,0,6,9,4,0,0,0,6,0,0,0,0,0,8,0,0,1,0,3,5,0,0,0,7];
				case "level_817":
					return [0,0,9,3,0,0,8,0,1,0,7,0,0,1,4,0,0,0,1,0,0,0,5,0,0,0,0,0,9,0,0,0,2,0,0,0,0,4,6,0,0,0,2,9,0,0,0,0,4,0,0,0,3,0,0,0,0,0,9,0,0,0,5,0,0,0,7,2,0,0,6,0,8,0,7,0,0,5,3,0,0];
				case "level_818":
					return [3,0,0,0,0,5,0,0,0,0,4,0,0,8,0,6,0,0,0,1,8,0,4,0,0,0,0,0,0,0,0,0,9,0,6,2,0,0,0,2,3,7,0,0,0,9,5,0,1,0,0,0,0,0,0,0,0,0,1,0,5,7,0,0,0,6,0,7,0,0,2,0,0,0,0,8,0,0,0,0,1];
				case "level_819":
					return [9,0,0,0,0,2,0,0,0,0,6,0,0,0,1,0,0,0,1,0,0,0,7,9,6,0,5,0,0,3,0,0,0,0,8,0,0,0,9,0,0,0,2,0,0,0,4,0,0,0,0,5,0,0,7,0,2,4,6,0,0,0,3,0,0,0,1,0,0,0,2,0,0,0,0,8,0,0,0,0,4];
				case "level_820":
					return [0,0,3,0,0,6,0,0,0,0,0,0,7,0,0,0,4,0,8,5,0,3,0,0,0,0,7,0,0,0,4,8,0,0,2,0,9,0,0,0,0,0,0,0,5,0,3,0,0,2,7,0,0,0,1,0,0,0,0,4,0,7,8,0,6,0,0,0,2,0,0,0,0,0,0,1,0,0,9,0,0];
				case "level_821":
					return [2,0,0,0,4,0,0,0,0,0,0,8,0,0,6,0,3,0,9,0,0,0,0,2,0,0,0,0,0,1,0,0,4,0,6,3,0,4,0,0,3,0,0,1,0,6,5,0,7,0,0,2,0,0,0,0,0,2,0,0,0,0,1,0,8,0,4,0,0,6,0,0,0,0,0,0,1,0,0,0,8];
				case "level_822":
					return [0,0,3,0,5,0,9,0,0,7,9,0,0,0,0,0,0,0,0,0,0,8,0,0,4,0,0,0,1,0,0,0,2,0,9,0,3,0,7,0,4,0,8,0,1,0,6,0,3,0,0,0,4,0,0,0,8,0,0,4,0,0,0,0,0,0,0,0,0,0,8,2,0,0,6,0,7,0,5,0,0];
				case "level_823":
					return [5,0,9,0,0,0,0,7,0,0,6,3,4,0,5,0,0,9,0,0,0,0,0,9,0,0,0,0,0,2,0,1,0,0,0,0,0,9,8,0,0,0,5,2,0,0,0,0,0,3,0,6,0,0,0,0,0,8,0,0,0,0,0,7,0,0,3,0,1,9,6,0,0,1,0,0,0,0,2,0,5];
				case "level_824":
					return [0,9,4,0,0,5,0,7,1,0,0,0,0,0,0,0,8,0,6,0,0,1,0,9,0,0,0,0,2,0,0,0,3,0,0,0,0,4,9,0,0,0,5,1,0,0,0,0,5,0,0,0,9,0,0,0,0,3,0,6,0,0,8,0,6,0,0,0,0,0,0,0,1,8,0,2,0,0,3,6,0];
				case "level_825":
					return [1,0,0,8,0,0,0,0,0,0,0,2,3,0,0,1,0,0,0,8,0,0,2,0,0,0,3,3,0,9,0,0,0,6,0,0,2,0,0,4,0,6,0,0,7,0,0,1,0,0,0,9,0,8,8,0,0,0,7,0,0,2,0,0,0,4,0,0,9,7,0,0,0,0,0,0,0,4,0,0,6];
				case "level_826":
					return [0,0,0,0,0,6,0,0,0,0,4,6,0,0,0,0,0,9,1,0,3,2,0,4,0,6,0,0,0,5,0,8,0,0,0,0,6,0,7,0,0,0,4,0,5,0,0,0,0,3,0,1,0,0,0,9,0,3,0,8,6,0,1,8,0,0,0,0,0,5,4,0,0,0,0,7,0,0,0,0,0];
				case "level_827":
					return [0,7,0,0,0,6,0,0,0,0,3,0,0,5,0,4,0,7,0,0,8,4,0,0,0,0,2,0,0,0,7,0,0,0,5,0,0,0,2,9,0,5,3,0,0,0,5,0,0,0,2,0,0,0,6,0,0,0,0,4,9,0,0,9,0,3,0,2,0,0,6,0,0,0,0,8,0,0,0,1,0];
				case "level_828":
					return [0,3,0,6,0,0,0,0,8,0,0,4,0,0,7,0,6,0,0,0,0,0,5,0,3,0,0,2,0,9,0,0,0,5,0,0,5,0,0,0,9,0,0,0,2,0,0,3,0,0,0,7,0,9,0,0,8,0,2,0,0,0,0,0,4,0,1,0,0,2,0,0,7,0,0,0,0,9,0,8,0];
				case "level_829":
					return [0,0,0,1,0,0,0,9,0,8,0,0,0,0,3,4,0,0,4,0,6,0,2,0,0,8,0,0,7,0,0,0,2,0,0,0,0,0,2,4,0,7,6,0,0,0,0,0,5,0,0,0,7,0,0,6,0,0,7,0,3,0,5,0,0,1,3,0,0,0,0,2,0,5,0,0,0,8,0,0,0];
				case "level_830":
					return [5,0,0,0,0,0,0,0,7,6,0,4,1,0,0,5,0,3,0,1,0,0,0,6,0,0,0,1,0,8,0,0,2,0,0,0,0,0,0,4,0,1,0,0,0,0,0,0,9,0,0,8,0,1,0,0,0,2,0,0,0,4,0,8,0,5,0,0,4,7,0,6,7,0,0,0,0,0,0,0,8];
				case "level_831":
					return [8,0,0,0,0,0,7,0,0,0,1,4,0,6,0,0,0,2,0,0,0,0,7,0,0,6,0,0,0,0,2,8,0,0,5,0,0,0,9,0,4,0,6,0,0,0,7,0,0,3,5,0,0,0,0,9,0,0,2,0,0,0,0,5,0,0,0,1,0,3,2,0,0,0,7,0,0,0,0,0,4];
				case "level_832":
					return [0,0,0,0,0,0,0,0,2,2,9,0,0,0,8,0,0,0,3,6,8,0,0,1,0,0,4,0,0,9,0,1,4,0,0,0,0,3,0,0,0,0,0,6,0,0,0,0,5,7,0,9,0,0,5,0,0,1,0,0,2,7,6,0,0,0,7,0,0,0,5,1,1,0,0,0,0,0,0,0,0];
				case "level_833":
					return [5,0,0,4,0,0,0,0,0,9,0,3,0,0,1,0,2,0,1,0,2,0,0,0,7,8,0,2,0,0,0,0,8,0,0,0,0,0,0,3,0,6,0,0,0,0,0,0,7,0,0,0,0,3,0,5,9,0,0,0,1,0,6,0,2,0,8,0,0,4,0,7,0,0,0,0,0,9,0,0,2];
				case "level_834":
					return [0,5,9,2,0,0,6,4,0,2,0,0,0,0,7,0,0,0,0,0,6,0,0,0,5,0,0,0,6,1,0,0,3,0,0,0,0,0,0,1,0,2,0,0,0,0,0,0,7,0,0,1,6,0,0,0,5,0,0,0,4,0,0,0,0,0,9,0,0,0,0,1,0,4,8,0,0,1,9,2,0];
				case "level_835":
					return [9,0,0,0,4,0,0,0,0,4,0,0,0,0,5,0,0,0,0,1,0,0,0,6,9,0,0,0,5,0,0,0,3,8,0,1,0,0,4,0,7,0,6,0,0,7,0,1,6,0,0,0,4,0,0,0,7,1,0,0,0,9,0,0,0,0,5,0,0,0,0,2,0,0,0,0,6,0,0,0,5];
				case "level_836":
					return [0,0,9,0,1,8,0,0,0,0,8,0,0,7,0,0,0,2,2,0,3,0,0,0,0,9,0,0,0,0,0,0,4,0,0,6,0,2,6,0,0,0,8,7,0,8,0,0,7,0,0,0,0,0,0,9,0,0,0,0,4,0,5,6,0,0,0,4,0,0,3,0,0,0,0,6,3,0,1,0,0];
				case "level_837":
					return [0,9,0,0,6,0,0,0,0,0,2,0,0,0,3,0,0,0,0,0,8,2,9,0,7,0,0,4,0,0,7,0,0,0,5,0,6,0,3,0,0,0,2,0,4,0,1,0,0,0,5,0,0,9,0,0,6,0,7,2,4,0,0,0,0,0,3,0,0,0,1,0,0,0,0,0,5,0,0,3,0];
				case "level_838":
					return [0,0,5,0,6,0,1,0,0,0,0,0,0,8,9,0,5,3,0,2,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,7,5,0,9,0,7,0,3,0,6,3,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,6,0,2,1,0,5,9,0,0,0,0,0,0,4,0,2,0,7,0,0];
				case "level_839":
					return [0,7,3,0,5,0,0,0,0,0,5,0,0,4,1,0,0,2,4,0,0,7,0,0,0,0,0,6,0,0,0,0,0,4,2,0,0,0,7,0,0,0,8,0,0,0,8,5,0,0,0,0,0,6,0,0,0,0,0,7,0,0,3,3,0,0,1,6,0,0,5,0,0,0,0,0,8,0,1,6,0];
				case "level_840":
					return [1,3,0,0,4,8,0,0,0,0,9,6,0,0,0,0,0,0,0,0,8,1,0,0,0,0,0,0,1,0,0,0,3,0,7,5,0,0,9,0,0,0,4,0,0,5,8,0,7,0,0,0,1,0,0,0,0,0,0,1,8,0,0,0,0,0,0,0,0,6,3,0,0,0,0,2,9,0,0,5,4];
				case "level_841":
					return [7,3,0,0,5,0,0,0,0,0,0,9,0,0,6,0,0,0,0,5,8,9,0,7,0,0,0,9,0,0,0,0,1,4,0,0,0,0,2,0,0,0,5,0,0,0,0,7,8,0,0,0,0,9,0,0,0,1,0,9,6,8,0,0,0,0,6,0,0,2,0,0,0,0,0,0,2,0,0,3,7];
				case "level_842":
					return [0,0,0,0,7,0,0,8,0,3,6,0,0,8,4,0,7,0,0,1,0,0,0,0,3,0,0,0,4,5,9,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,5,7,9,0,0,0,6,0,0,0,0,1,0,0,3,0,7,1,0,0,2,6,0,5,0,0,9,0,0,0,0];
				case "level_843":
					return [0,0,0,7,0,0,3,6,0,0,6,0,0,0,0,0,0,0,0,3,0,6,0,0,7,2,9,0,0,0,3,7,0,0,0,1,0,0,5,0,0,0,2,0,0,1,0,0,0,6,4,0,0,0,8,5,2,0,0,6,0,4,0,0,0,0,0,0,0,0,9,0,0,9,1,0,0,8,0,0,0];
				case "level_844":
					return [0,7,6,2,4,0,0,0,0,0,0,5,0,0,0,0,8,0,0,3,0,0,6,0,9,0,0,0,1,0,0,0,0,0,7,4,0,0,0,9,0,7,0,0,0,6,5,0,0,0,0,0,9,0,0,0,8,0,2,0,0,3,0,0,6,0,0,0,0,5,0,0,0,0,0,0,5,3,2,6,0];
				case "level_845":
					return [0,0,0,2,0,0,0,4,0,0,0,0,0,9,0,0,2,0,5,0,0,0,1,8,0,0,3,0,4,0,0,0,9,7,0,0,2,0,5,0,0,0,3,0,8,0,0,3,1,0,0,0,9,0,6,0,0,8,7,0,0,0,1,0,7,0,0,5,0,0,0,0,0,8,0,0,0,2,0,0,0];
				case "level_846":
					return [0,0,0,1,0,4,0,0,0,5,7,0,0,6,0,0,0,0,4,0,9,0,5,0,0,8,0,1,0,2,0,0,0,0,0,0,0,4,7,0,0,0,3,2,0,0,0,0,0,0,0,9,0,6,0,6,0,0,8,0,2,0,9,0,0,0,0,1,0,0,3,4,0,0,0,2,0,3,0,0,0];
				case "level_847":
					return [3,0,0,7,0,6,1,8,0,0,0,0,4,0,0,0,0,0,0,0,6,0,0,0,0,9,2,0,0,0,0,7,0,0,1,0,0,4,8,0,0,0,9,2,0,0,9,0,0,6,0,0,0,0,2,8,0,0,0,0,3,0,0,0,0,0,0,0,8,0,0,0,0,7,1,5,0,2,0,0,8];
				case "level_848":
					return [0,0,0,2,0,0,0,9,0,0,0,7,1,0,0,0,0,5,0,0,0,0,9,0,0,7,0,0,5,4,6,0,0,0,0,2,0,0,1,0,8,0,9,0,0,9,0,0,0,0,1,5,8,0,0,2,0,0,1,0,0,0,0,7,0,0,0,0,5,8,0,0,0,3,0,0,0,2,0,0,0];
				case "level_849":
					return [0,0,0,0,5,8,0,0,2,0,9,0,0,0,0,7,0,0,0,2,0,0,6,0,0,8,0,2,0,0,5,0,0,0,3,0,1,0,8,0,0,0,4,0,7,0,4,0,0,0,1,0,0,5,0,3,0,0,1,0,0,9,0,0,0,4,0,0,0,0,7,0,6,0,0,3,8,0,0,0,0];
				case "level_850":
					return [0,0,7,0,0,8,0,0,0,2,0,0,9,0,0,0,3,0,0,0,4,0,1,0,0,7,9,0,0,0,7,0,0,1,0,0,3,0,0,5,0,1,0,0,4,0,0,1,0,0,3,0,0,0,4,5,0,0,3,0,8,0,0,0,8,0,0,0,9,0,0,5,0,0,0,2,0,0,6,0,0];
				case "level_851":
					return [0,0,0,0,0,0,0,0,0,5,0,0,0,6,3,1,4,0,6,0,1,4,0,0,0,7,0,8,0,0,0,0,0,0,2,0,0,9,0,8,0,2,0,6,0,0,4,0,0,0,0,0,0,3,0,2,0,0,0,8,9,0,5,0,5,8,7,3,0,0,0,4,0,0,0,0,0,0,0,0,0];
				case "level_852":
					return [8,0,5,0,0,0,0,0,0,0,0,0,3,0,1,0,0,0,2,3,0,0,9,0,0,0,0,0,0,3,0,2,0,0,0,4,0,7,0,6,1,8,0,9,0,1,0,0,0,4,0,5,0,0,0,0,0,0,6,0,0,5,9,0,0,0,9,0,7,0,0,0,0,0,0,0,0,0,8,0,2];
				case "level_853":
					return [0,0,0,2,6,0,0,7,0,0,0,0,4,0,0,5,3,0,0,0,4,0,0,3,0,0,8,0,0,7,0,0,0,0,0,9,0,5,2,0,0,0,3,6,0,9,0,0,0,0,0,7,0,0,2,0,0,3,0,0,8,0,0,0,9,5,0,0,6,0,0,0,0,8,0,0,9,5,0,0,0];
				case "level_854":
					return [0,3,5,0,6,0,0,0,0,0,6,9,0,0,0,0,1,8,0,8,0,4,0,0,0,0,0,0,0,0,0,0,1,2,9,0,0,0,0,3,0,9,0,0,0,0,9,3,5,0,0,0,0,0,0,0,0,0,0,4,0,2,0,9,5,0,0,0,0,8,7,0,0,0,0,0,7,0,4,6,0];
				case "level_855":
					return [0,0,5,0,0,0,0,0,0,9,7,0,6,0,0,0,0,0,6,3,0,8,2,9,0,0,0,2,0,0,0,0,0,9,5,0,0,0,0,1,0,6,0,0,0,0,1,4,0,0,0,0,0,7,0,0,0,9,7,2,0,8,3,0,0,0,0,0,1,0,6,4,0,0,0,0,0,0,7,0,0];
				case "level_856":
					return [0,7,0,0,0,9,0,0,0,8,0,4,7,0,0,0,0,2,0,0,0,2,0,0,5,0,0,0,0,0,5,8,0,6,0,0,1,0,0,0,0,0,0,0,4,0,0,7,0,6,2,0,0,0,0,0,9,0,0,6,0,0,0,3,0,0,0,0,5,2,0,8,0,0,0,3,0,0,0,1,0];
				case "level_857":
					return [6,0,0,0,1,0,3,4,0,0,0,0,4,0,9,0,0,0,0,0,0,0,8,0,2,0,9,0,0,0,0,0,0,6,3,0,2,7,0,0,0,0,0,9,4,0,4,8,0,0,0,0,0,0,7,0,5,0,6,0,0,0,0,0,0,0,8,0,2,0,0,0,0,3,2,0,5,0,0,0,1];
				case "level_858":
					return [0,6,0,0,9,0,0,5,0,0,0,0,8,5,0,0,0,0,2,0,4,0,0,3,0,0,0,0,4,0,7,0,0,9,0,0,5,2,0,0,0,0,0,7,1,0,0,9,0,0,1,0,4,0,0,0,0,1,0,0,3,0,9,0,0,0,0,8,2,0,0,0,0,7,0,0,4,0,0,8,0];
				case "level_859":
					return [7,0,3,1,5,0,0,4,0,2,0,0,0,0,3,8,7,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,5,0,8,0,0,3,0,2,0,0,6,0,3,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,6,9,4,0,0,0,0,1,0,7,0,0,6,5,9,0,4];
				case "level_860":
					return [0,0,0,0,2,0,0,5,0,1,0,4,0,5,0,0,0,2,0,0,0,1,0,9,0,8,0,0,0,0,2,0,0,4,0,0,5,0,0,0,3,0,0,0,6,0,0,3,0,0,7,0,0,0,0,4,0,3,0,8,0,0,0,6,0,0,0,4,0,3,0,8,0,7,0,0,9,0,0,0,0];
				case "level_861":
					return [0,0,6,0,0,0,0,0,0,5,2,0,1,0,0,0,0,0,1,8,0,9,3,5,0,0,0,3,0,0,0,0,0,5,6,0,0,0,0,4,0,1,0,0,0,0,4,7,0,0,0,0,0,2,0,0,0,5,2,3,0,9,8,0,0,0,0,0,4,0,1,7,0,0,0,0,0,0,2,0,0];
				case "level_862":
					return [8,0,0,0,0,9,0,0,0,0,1,6,8,0,0,0,0,0,0,5,3,0,0,2,0,0,0,0,7,4,0,3,0,0,9,0,0,8,0,0,0,0,0,7,0,0,9,0,0,4,0,3,5,0,0,0,0,4,0,0,8,1,0,0,0,0,0,0,7,9,3,0,0,0,0,6,0,0,0,0,2];
				case "level_863":
					return [0,4,0,8,9,0,0,0,0,0,0,0,4,0,0,9,0,2,0,0,0,0,0,5,0,8,0,0,8,5,3,0,0,0,0,0,3,0,0,0,4,0,0,0,9,0,0,0,0,0,1,5,3,0,0,2,0,9,0,0,0,0,0,5,0,7,0,0,8,0,0,0,0,0,0,0,3,6,0,2,0];
				case "level_864":
					return [6,0,0,0,0,2,0,9,0,0,0,1,6,0,4,3,0,0,0,0,0,9,0,0,0,1,0,0,3,0,0,0,0,4,2,0,0,0,7,0,0,0,8,0,0,0,6,2,0,0,0,0,3,0,0,8,0,0,0,6,0,0,0,0,0,6,7,0,9,2,0,0,0,9,0,3,0,0,0,0,7];
				case "level_865":
					return [2,3,4,6,0,0,0,0,0,0,0,0,0,0,0,3,0,6,9,0,6,0,0,0,2,0,0,0,7,0,0,9,1,0,0,8,0,0,0,0,0,0,0,0,0,4,0,0,8,5,0,0,2,0,0,0,1,0,0,0,4,0,7,6,0,8,0,0,0,0,0,0,0,0,0,0,0,9,5,6,1];
				case "level_866":
					return [0,0,0,5,3,0,6,0,9,0,0,0,0,0,6,0,5,0,0,0,0,0,0,0,0,8,2,1,0,4,9,0,0,0,0,6,0,3,0,0,0,0,0,2,0,6,0,0,0,0,1,4,0,5,9,8,0,0,0,0,0,0,0,0,5,0,6,0,0,0,0,0,4,0,3,0,2,7,0,0,0];
				case "level_867":
					return [0,1,0,0,0,0,0,0,7,0,0,2,0,8,0,0,0,0,6,0,0,0,4,0,8,5,0,0,0,1,0,5,6,0,0,0,0,2,0,0,7,0,0,9,0,0,0,0,8,3,0,6,0,0,0,7,4,0,9,0,0,0,8,0,0,0,0,1,0,9,0,0,3,0,0,0,0,0,0,1,0];
				case "level_868":
					return [0,0,0,0,0,4,8,0,7,5,0,8,9,3,0,0,0,0,0,0,6,0,0,0,0,0,1,0,0,4,0,9,0,0,0,2,0,0,3,0,0,0,4,0,0,8,0,0,0,2,0,5,0,0,6,0,0,0,0,0,2,0,0,0,0,0,0,1,8,7,0,9,3,0,7,2,0,0,0,0,0];
				case "level_869":
					return [0,0,8,0,0,0,9,0,0,5,1,2,0,7,0,0,0,0,0,0,0,1,0,0,6,0,7,0,4,0,0,0,5,0,6,0,0,0,0,0,0,0,0,0,0,0,7,0,3,0,0,0,9,0,3,0,1,0,0,8,0,0,0,0,0,0,0,2,0,5,3,9,0,0,5,0,0,0,2,0,0];
				case "level_870":
					return [0,0,3,4,0,0,8,0,0,0,8,7,9,0,0,4,6,0,9,0,0,0,0,0,0,0,0,0,0,9,0,3,1,0,0,2,0,0,0,0,0,0,0,0,0,7,0,0,2,9,0,3,0,0,0,0,0,0,0,0,0,0,3,0,6,5,0,0,9,7,4,0,0,0,8,0,0,4,6,0,0];
				case "level_871":
					return [0,9,0,2,4,0,0,0,0,4,0,0,0,9,0,0,8,0,1,2,0,3,0,0,0,0,0,0,0,4,0,0,0,1,0,0,5,8,0,0,0,0,0,7,3,0,0,9,0,0,0,5,0,0,0,0,0,0,0,5,0,1,7,0,3,0,0,1,0,0,0,6,0,0,0,0,6,9,0,2,0];
				case "level_872":
					return [0,0,0,0,3,0,7,0,0,0,0,0,7,0,0,8,0,0,0,6,0,4,0,0,0,0,1,0,4,6,3,0,0,0,0,5,0,5,0,0,6,0,0,3,0,7,0,0,0,0,9,4,2,0,4,0,0,0,0,3,0,1,0,0,0,5,0,0,7,0,0,0,0,0,1,0,5,0,0,0,0];
				case "level_873":
					return [0,4,0,0,0,8,0,5,0,0,6,5,0,0,9,8,2,0,0,0,0,0,0,0,0,0,7,2,0,0,3,9,0,0,7,0,0,0,0,0,0,0,0,0,0,0,9,0,0,7,1,0,0,3,9,0,0,0,0,0,0,0,0,0,2,4,9,0,0,5,8,0,0,7,0,8,0,0,0,4,0];
				case "level_874":
					return [0,0,0,0,0,6,2,5,0,0,0,0,8,7,3,1,4,0,0,0,0,0,0,0,0,0,7,5,0,6,0,0,0,0,7,0,0,0,0,6,0,2,0,0,0,0,3,0,0,0,0,9,0,8,9,0,0,0,0,0,0,0,0,0,2,4,1,3,8,0,0,0,0,8,7,2,0,0,0,0,0];
				case "level_875":
					return [0,5,0,0,4,0,0,0,9,4,1,0,0,5,0,0,0,0,0,0,3,0,0,6,0,0,0,0,0,0,0,0,8,2,9,0,0,0,0,2,3,7,0,0,0,0,6,8,1,0,0,0,0,0,0,0,0,4,0,0,1,0,0,0,0,0,0,1,0,0,7,6,9,0,0,0,7,0,0,2,0];
				case "level_876":
					return [2,0,6,0,0,8,0,0,0,0,0,0,7,3,0,0,0,0,0,9,0,0,5,0,0,3,0,0,6,0,1,0,0,5,0,0,3,2,0,0,0,0,0,1,4,0,0,5,0,0,4,0,6,0,0,1,0,0,6,0,0,7,0,0,0,0,0,7,2,0,0,0,0,0,0,4,0,0,8,0,5];
				case "level_877":
					return [0,0,0,3,0,7,0,0,0,0,9,3,0,4,0,0,0,0,7,6,0,0,5,0,2,0,0,6,2,0,0,0,0,0,0,0,3,0,7,0,0,0,9,0,1,0,0,0,0,0,0,0,4,7,0,0,5,0,8,0,0,9,6,0,0,0,0,2,0,1,8,0,0,0,0,9,0,4,0,0,0];
				case "level_878":
					return [0,0,3,0,0,9,0,0,7,0,1,9,0,0,0,0,5,0,0,2,0,0,7,5,0,0,0,3,7,0,2,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,7,0,3,2,0,0,0,7,6,0,0,8,0,0,4,0,0,0,0,1,2,0,8,0,0,4,0,0,5,0,0];
				case "level_879":
					return [0,0,0,0,3,0,8,0,0,0,2,0,0,0,0,6,0,9,8,0,0,7,0,2,0,0,0,9,0,3,0,0,5,4,0,0,0,4,0,0,0,0,0,6,0,0,0,8,4,0,0,9,0,3,0,0,0,9,0,1,0,0,2,5,0,2,0,0,0,0,9,0,0,0,4,0,8,0,0,0,0];
				case "level_880":
					return [0,0,0,0,0,0,0,0,4,4,0,0,0,5,2,3,0,0,0,1,0,3,0,7,0,5,0,0,0,0,0,1,0,4,2,0,9,0,0,0,0,0,0,0,5,0,7,1,0,6,0,0,0,0,0,9,0,7,0,6,0,3,0,0,0,6,4,9,0,0,0,2,5,0,0,0,0,0,0,0,0];
				case "level_881":
					return [2,0,0,0,5,0,8,0,0,0,0,0,8,3,0,0,7,0,0,0,7,0,0,0,0,9,2,1,0,0,6,0,0,0,0,0,0,8,5,0,0,0,2,1,0,0,0,0,0,0,5,0,0,8,4,6,0,0,0,0,7,0,0,0,3,0,0,9,1,0,0,0,0,0,9,0,6,0,0,0,1];
				case "level_882":
					return [4,0,0,0,3,1,0,0,8,0,0,0,0,5,0,6,0,0,0,0,0,6,0,0,2,0,0,0,0,2,0,0,5,0,9,0,6,4,0,0,0,0,0,8,1,0,8,0,3,0,0,5,0,0,0,0,1,0,0,6,0,0,0,0,0,9,0,4,0,0,0,0,7,0,0,1,9,0,0,0,3];
				case "level_883":
					return [8,0,2,0,0,0,0,3,0,0,0,0,3,0,1,0,0,6,0,0,6,0,4,0,0,0,0,0,0,5,7,0,0,4,0,8,0,2,0,0,0,0,0,5,0,4,0,8,0,0,5,6,0,0,0,0,0,0,6,0,5,0,0,3,0,0,9,0,8,0,0,0,0,8,0,0,0,0,3,0,7];
				case "level_884":
					return [0,0,8,0,0,7,0,0,6,0,0,2,0,6,0,0,4,0,0,5,0,0,0,0,8,0,0,0,0,0,7,0,0,0,0,0,8,0,1,2,5,3,6,0,4,0,0,0,0,0,8,0,0,0,0,0,7,0,0,0,0,3,0,0,4,0,0,9,0,5,0,0,9,0,0,4,0,0,1,0,0];
				case "level_885":
					return [2,8,0,0,3,9,0,6,0,0,3,0,0,0,0,2,0,0,0,0,0,0,5,0,0,1,0,0,5,9,1,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,5,1,7,0,0,4,0,0,9,0,0,0,0,0,0,6,0,0,0,0,3,0,0,9,0,7,4,0,0,2,6];
				case "level_886":
					return [0,0,8,0,0,0,0,5,0,0,2,9,4,7,0,0,0,0,0,0,0,0,0,8,9,1,0,0,0,6,0,8,0,0,4,0,0,0,3,0,0,0,1,0,0,0,8,0,0,2,0,3,0,0,0,9,4,3,0,0,0,0,0,0,0,0,0,1,2,4,6,0,0,7,0,0,0,0,5,0,0];
				case "level_887":
					return [0,0,0,0,0,0,7,0,0,0,0,0,0,0,6,0,9,8,0,0,0,9,1,2,0,6,3,7,0,9,0,0,0,0,1,0,0,0,0,6,0,4,0,0,0,0,8,0,0,0,0,5,0,4,2,3,0,1,8,9,0,0,0,6,5,0,4,0,0,0,0,0,0,0,8,0,0,0,0,0,0];
				case "level_888":
					return [0,0,0,0,8,0,9,0,0,0,0,6,0,0,2,0,1,0,8,0,9,1,0,7,0,0,0,0,2,0,8,0,0,0,3,0,1,0,0,0,0,0,0,0,7,0,4,0,0,0,6,0,9,0,0,0,0,2,0,8,5,0,1,0,9,0,7,0,0,2,0,0,0,0,2,0,5,0,0,0,0];
				case "level_889":
					return [0,0,0,0,6,0,1,4,0,0,0,0,0,0,4,0,0,2,9,0,0,5,2,0,0,6,0,0,9,2,0,0,0,0,0,8,0,0,7,0,0,0,4,0,0,8,0,0,0,0,0,6,7,0,0,6,0,0,8,5,0,0,1,1,0,0,4,0,0,0,0,0,0,8,5,0,7,0,0,0,0];
				case "level_890":
					return [0,0,0,4,0,0,8,0,0,0,3,0,0,5,6,0,2,0,0,0,0,0,9,0,4,0,0,0,0,8,0,0,9,0,0,7,3,4,0,0,0,0,0,6,2,2,0,0,5,0,0,9,0,0,0,0,7,0,3,0,0,0,0,0,1,0,6,7,0,0,5,0,0,0,6,0,0,4,0,0,0];
				case "level_891":
					return [0,7,0,9,0,0,0,0,4,4,0,0,0,6,0,0,0,0,0,0,0,4,0,1,8,0,6,0,2,0,0,0,3,0,7,0,0,0,8,0,0,0,9,0,0,0,4,0,1,0,0,0,5,0,7,0,1,8,0,9,0,0,0,0,0,0,0,1,0,0,0,7,3,0,0,0,0,4,0,8,0];
				case "level_892":
					return [0,0,0,8,0,0,2,0,0,3,0,0,0,0,2,0,9,4,0,5,0,0,0,3,0,0,0,0,7,0,0,4,5,0,0,0,9,0,0,0,0,0,0,0,6,0,0,0,3,7,0,0,2,0,0,0,0,7,0,0,0,8,0,4,3,0,5,0,0,0,0,1,0,0,6,0,0,1,0,0,0];
				case "level_893":
					return [0,0,0,0,0,3,9,0,0,0,0,9,2,6,0,0,0,0,0,0,0,5,0,0,0,8,7,8,0,6,1,0,0,0,0,0,0,3,0,0,4,0,0,6,0,0,0,0,0,0,6,5,0,8,3,9,0,0,0,4,0,0,0,0,0,0,0,3,5,4,0,0,0,0,5,8,0,0,0,0,0];
				case "level_894":
					return [0,0,0,5,6,0,2,0,0,4,0,0,0,0,0,0,0,0,0,1,5,2,0,0,0,0,0,3,5,0,0,0,9,0,2,0,0,8,0,0,0,0,0,3,0,0,6,0,7,0,0,0,1,5,0,0,0,0,0,1,7,5,0,0,0,0,0,0,0,0,0,4,0,0,9,0,2,8,0,0,0];
				case "level_895":
					return [8,0,0,0,0,2,0,0,0,5,0,0,0,6,0,0,0,9,0,0,0,0,0,0,7,8,0,0,5,0,3,0,0,0,2,0,6,0,3,0,2,0,1,0,8,0,1,0,0,0,7,0,4,0,0,4,6,0,0,0,0,0,0,3,0,0,0,9,0,0,0,4,0,0,0,8,0,0,0,0,2];
				case "level_896":
					return [0,0,2,0,7,0,0,9,0,5,0,0,0,0,6,0,0,0,0,4,7,0,5,0,0,0,0,0,0,0,0,0,5,4,0,8,0,0,0,7,3,2,0,0,0,2,0,9,8,0,0,0,0,0,0,0,0,0,1,0,5,6,0,0,0,0,4,0,0,0,0,3,0,9,0,0,6,0,1,0,0];
				case "level_897":
					return [0,8,0,1,0,7,4,0,0,2,0,0,0,0,0,0,5,0,0,0,0,6,8,0,0,0,2,6,0,0,0,0,0,0,1,0,0,0,8,0,6,0,7,0,0,0,9,0,0,0,0,0,0,5,1,0,0,0,7,8,0,0,0,0,3,0,0,0,0,0,0,4,0,0,2,4,0,6,0,3,0];
				case "level_898":
					return [0,7,0,0,0,0,0,0,0,0,0,8,0,1,3,4,0,0,0,0,0,4,0,8,0,2,5,6,0,2,0,0,0,3,8,0,0,0,0,0,0,0,0,0,0,0,4,7,0,0,0,6,0,2,1,2,0,6,0,4,0,0,0,0,0,6,8,7,0,5,0,0,0,0,0,0,0,0,0,6,0];
				case "level_899":
					return [0,0,9,0,0,8,0,0,0,0,3,0,0,0,1,0,0,2,0,0,2,0,9,0,0,0,0,0,8,0,0,0,4,3,0,5,9,0,0,0,7,0,0,0,1,3,0,7,1,0,0,0,9,0,0,0,0,0,1,0,8,0,0,7,0,0,3,0,0,0,2,0,0,0,0,8,0,0,6,0,0];
				case "level_900":
					return [0,0,0,4,1,0,0,0,8,0,2,0,0,3,0,4,0,0,0,0,8,0,0,0,0,2,6,0,5,0,7,0,0,0,0,0,4,0,3,0,0,0,2,0,5,0,0,0,0,0,3,0,4,0,7,9,0,0,0,0,8,0,0,0,0,6,0,7,0,0,5,0,1,0,0,0,6,5,0,0,0];
				case "level_901":
					return [0,2,0,0,0,0,8,0,0,0,0,4,5,8,0,7,0,2,0,0,3,0,9,0,0,0,0,0,4,0,0,0,3,9,5,0,0,0,0,0,0,0,0,0,0,0,3,1,9,0,0,0,8,0,0,0,0,0,5,0,6,0,0,4,0,2,0,6,1,5,0,0,0,0,8,0,0,0,0,4,0];
				case "level_902":
					return [0,0,0,6,1,0,0,0,0,0,8,2,0,0,4,0,0,0,1,0,0,0,5,0,0,0,9,5,0,0,4,0,0,8,0,0,9,4,0,0,0,0,0,3,6,0,0,8,0,0,9,0,0,5,3,0,0,0,8,0,0,0,7,0,0,0,2,0,0,5,6,0,0,0,0,0,3,1,0,0,0];
				case "level_903":
					return [1,0,9,7,2,0,0,3,0,0,0,8,0,0,1,0,9,4,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,2,0,0,0,4,1,0,8,6,0,0,0,1,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,5,6,0,3,0,0,7,0,0,0,9,0,0,6,2,3,0,5];
				case "level_904":
					return [0,0,0,0,0,0,0,6,0,4,0,0,0,2,3,0,0,0,0,0,0,0,0,5,7,0,8,0,0,1,8,0,0,5,7,0,0,0,3,0,0,0,9,0,0,0,9,7,0,0,4,2,0,0,7,0,5,2,0,0,0,0,0,0,0,0,7,1,0,0,0,2,0,6,0,0,0,0,0,0,0];
				case "level_905":
					return [0,6,0,1,0,0,0,0,5,0,0,0,0,9,0,6,0,0,0,0,9,0,0,4,0,2,0,1,0,5,0,0,0,3,0,0,9,0,0,0,1,0,0,0,7,0,0,7,0,0,0,1,0,9,0,8,0,5,0,0,2,0,0,0,0,3,0,7,0,0,0,0,6,0,0,0,0,8,0,3,0];
				case "level_906":
					return [0,0,0,0,7,0,8,5,0,0,0,0,6,0,0,0,0,1,0,0,0,8,0,1,0,7,9,2,0,0,4,0,0,1,0,0,7,0,0,0,0,0,0,0,3,0,0,1,0,0,9,0,0,8,6,9,0,1,0,4,0,0,0,3,0,0,0,0,6,0,0,0,0,5,8,0,3,0,0,0,0];
				case "level_907":
					return [0,0,0,7,0,0,3,0,1,0,8,9,0,0,0,0,0,0,0,0,4,0,5,0,0,6,0,3,0,0,0,7,8,0,4,0,0,0,7,0,0,0,8,0,0,0,4,0,9,6,0,0,0,2,0,2,0,0,8,0,5,0,0,0,0,0,0,0,0,6,3,0,9,0,5,0,0,7,0,0,0];
				case "level_908":
					return [0,0,0,8,3,0,0,4,0,1,0,0,0,0,2,5,0,0,0,0,0,1,0,0,0,2,9,4,0,0,0,0,0,7,0,0,8,9,0,0,0,0,0,3,2,0,0,7,0,0,0,0,0,4,9,7,0,0,0,3,0,0,0,0,0,8,2,0,0,0,0,5,0,5,0,0,7,9,0,0,0];
				case "level_909":
					return [0,0,0,0,0,0,0,6,4,0,9,0,0,7,0,0,0,5,5,0,8,0,0,1,0,0,0,0,3,0,8,4,0,9,0,0,1,0,0,0,0,0,0,0,7,0,0,6,0,1,7,0,3,0,0,0,0,1,0,0,2,0,6,3,0,0,0,5,0,0,4,0,8,7,0,0,0,0,0,0,0];
				case "level_910":
					return [0,0,4,0,9,0,0,0,0,0,0,0,3,0,2,0,4,0,0,1,8,0,0,0,0,0,3,0,0,6,5,0,0,9,1,0,8,0,0,0,0,0,0,0,6,0,9,1,0,0,6,4,0,0,1,0,0,0,0,0,3,5,0,0,3,0,7,0,1,0,0,0,0,0,0,0,4,0,6,0,0];
				case "level_911":
					return [3,0,0,0,0,0,0,0,0,7,8,0,6,0,0,4,0,9,0,0,0,9,0,8,0,5,0,0,0,0,2,0,0,0,0,1,8,0,6,0,0,0,9,0,4,9,0,0,0,0,6,0,0,0,0,3,0,5,0,2,0,0,0,5,0,2,0,0,1,0,8,3,0,0,0,0,0,0,0,0,5];
				case "level_912":
					return [0,0,1,0,3,0,0,0,0,7,0,0,0,8,0,0,0,2,0,0,0,0,6,5,9,8,0,0,0,0,0,0,0,0,3,0,3,1,0,0,7,0,0,5,6,0,7,0,0,0,0,0,0,0,0,3,5,6,4,0,0,0,0,9,0,0,0,1,0,0,0,5,0,0,0,0,2,0,8,0,0];
				case "level_913":
					return [0,0,0,0,6,0,0,0,1,1,0,2,0,0,7,5,0,0,0,0,0,3,1,0,0,9,0,0,0,0,4,0,0,0,5,0,0,5,4,0,0,0,8,3,0,0,7,0,0,0,3,0,0,0,0,8,0,0,4,9,0,0,0,0,0,7,6,0,0,9,0,2,6,0,0,0,5,0,0,0,0];
				case "level_914":
					return [0,4,0,0,0,0,0,0,0,0,6,8,3,0,0,0,4,5,0,0,0,5,0,4,6,0,0,0,0,0,9,0,0,0,7,0,7,2,0,0,0,0,0,8,9,0,3,0,0,0,5,0,0,0,0,0,4,8,0,7,0,0,0,2,7,0,0,0,9,8,1,0,0,0,0,0,0,0,0,6,0];
				case "level_915":
					return [2,0,0,0,0,1,0,0,0,0,9,0,0,0,7,0,4,8,0,0,0,9,0,0,5,0,0,3,0,0,0,1,8,0,0,0,0,5,0,0,0,0,0,6,0,0,0,0,7,4,0,0,0,1,0,0,3,0,0,2,0,0,0,6,4,0,3,0,0,0,8,0,0,0,0,8,0,0,0,0,7];
				case "level_916":
					return [8,0,0,0,0,6,0,4,7,0,0,0,1,0,0,6,0,0,0,2,0,0,0,8,0,0,0,0,9,0,0,7,2,0,0,0,4,0,0,0,0,0,0,0,3,0,0,0,8,9,0,0,6,0,0,0,0,9,0,0,0,1,0,0,0,3,0,0,5,0,0,0,7,8,0,2,0,0,0,0,5];
				case "level_917":
					return [0,0,0,0,0,8,3,0,5,0,0,0,1,0,0,7,0,9,0,0,0,2,0,0,0,4,0,0,0,5,0,1,0,6,0,3,0,0,9,0,0,0,8,0,0,1,0,8,0,3,0,5,0,0,0,9,0,0,0,5,0,0,0,3,0,6,0,0,4,0,0,0,2,0,7,9,0,0,0,0,0];
				case "level_918":
					return [1,9,0,4,3,0,0,5,0,0,0,0,5,0,0,1,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,0,0,6,7,0,0,0,0,0,0,0,4,9,0,0,0,0,0,8,0,0,0,8,0,0,0,2,0,0,0,0,0,7,0,0,5,0,0,0,0,6,0,0,1,8,0,3,7];
				case "level_919":
					return [0,0,0,9,0,7,8,0,3,0,1,0,0,6,4,0,7,0,7,0,0,0,0,0,0,0,0,0,7,3,0,0,0,0,6,9,0,0,0,0,0,0,0,0,0,4,2,0,0,0,0,7,3,0,0,0,0,0,0,0,0,0,6,0,9,0,2,8,0,0,4,0,3,0,1,4,0,9,0,0,0];
				case "level_920":
					return [0,5,8,0,0,0,0,4,0,0,0,7,0,0,4,0,0,1,0,1,0,0,3,6,0,0,0,5,2,0,6,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,5,0,6,2,0,0,0,7,6,0,0,5,0,6,0,0,9,0,0,2,0,0,0,7,0,0,0,0,9,8,0];
				case "level_921":
					return [2,0,3,7,0,5,0,1,0,0,0,0,0,0,1,0,0,0,0,5,1,0,0,0,0,0,8,0,0,9,0,6,0,0,0,0,1,0,4,0,0,0,5,0,9,0,0,0,0,3,0,2,0,0,6,0,0,0,0,0,9,5,0,0,0,0,4,0,0,0,0,0,0,8,0,3,0,6,1,0,2];
				case "level_922":
					return [0,0,0,2,0,6,8,0,4,0,0,0,0,4,0,0,2,3,0,0,0,7,0,0,6,0,0,0,0,1,9,0,0,0,6,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,8,2,0,0,0,0,5,0,0,7,0,0,0,3,2,0,0,5,0,0,0,0,8,0,7,6,0,9,0,0,0];
				case "level_923":
					return [0,7,0,0,3,0,0,0,0,0,0,2,0,0,7,8,0,0,6,0,0,4,0,0,0,0,2,8,9,0,0,0,4,0,3,0,0,0,4,0,0,0,9,0,0,0,3,0,7,0,0,0,2,8,1,0,0,0,0,2,0,0,4,0,0,8,3,0,0,2,0,0,0,0,0,0,7,0,0,5,0];
				case "level_924":
					return [0,0,4,0,0,6,0,0,0,6,0,0,0,1,3,0,4,8,3,0,0,0,0,5,0,0,0,0,7,0,0,0,0,2,0,0,0,3,0,0,0,0,0,5,0,0,0,9,0,0,0,0,8,0,0,0,0,2,0,0,0,0,9,1,5,0,9,4,0,0,0,7,0,0,0,6,0,0,5,0,0];
				case "level_925":
					return [6,0,0,0,2,0,0,0,0,0,3,0,9,0,0,0,7,0,0,0,9,0,0,8,5,0,0,9,5,0,0,0,2,0,0,8,0,0,4,0,0,0,3,0,0,8,0,0,3,0,0,0,5,4,0,0,5,2,0,0,9,0,0,0,9,0,0,0,3,0,1,0,0,0,0,0,8,0,0,0,2];
				case "level_926":
					return [4,0,0,0,0,0,0,0,3,0,0,5,0,0,9,0,0,0,7,3,0,5,0,0,0,2,4,6,4,0,0,0,8,0,0,0,0,0,0,6,0,5,0,0,0,0,0,0,9,0,0,0,4,6,1,2,0,0,0,6,0,5,7,0,0,0,7,0,0,6,0,0,3,0,0,0,0,0,0,0,2];
				case "level_927":
					return [0,1,0,0,0,0,0,0,5,0,9,4,0,0,0,1,0,6,0,8,0,1,0,6,0,0,0,2,0,0,0,0,9,0,0,0,0,4,0,0,0,0,0,5,0,0,0,0,8,0,0,0,0,7,0,0,0,5,0,3,0,7,0,7,0,9,0,0,0,2,4,0,8,0,0,0,0,0,0,9,0];
				case "level_928":
					return [9,0,0,0,0,7,0,0,1,0,6,0,0,0,2,0,0,0,0,8,0,0,6,0,4,0,0,0,0,0,6,0,1,8,0,5,0,0,0,0,4,0,0,0,0,6,0,7,9,0,5,0,0,0,0,0,3,0,2,0,0,5,0,0,0,0,3,0,0,0,9,0,2,0,0,1,0,0,0,0,8];
				case "level_929":
					return [0,0,0,0,0,0,0,5,2,0,9,0,0,6,0,0,0,4,4,0,1,0,0,7,0,0,0,0,8,0,1,2,0,9,0,0,7,0,0,0,0,0,0,0,6,0,0,5,0,7,6,0,8,0,0,0,0,7,0,0,3,0,5,8,0,0,0,4,0,0,2,0,1,6,0,0,0,0,0,0,0];
				case "level_930":
					return [0,8,0,0,1,0,0,7,0,2,0,0,0,0,8,0,0,5,0,0,0,9,0,6,4,0,0,0,9,0,4,0,0,0,0,1,0,0,4,0,0,0,9,0,0,7,0,0,0,0,1,0,4,0,0,0,3,7,0,9,0,0,0,1,0,0,8,0,0,0,0,7,0,7,0,0,6,0,0,8,0];
				case "level_931":
					return [0,2,0,0,1,5,0,0,0,0,0,6,0,4,0,0,0,0,7,0,0,6,0,0,9,0,5,0,7,0,0,0,3,0,0,0,1,4,0,0,0,0,0,3,2,0,0,0,1,0,0,0,4,0,9,0,8,0,0,7,0,0,4,0,0,0,0,6,0,8,0,0,0,0,0,3,8,0,0,5,0];
				case "level_932":
					return [0,8,1,0,0,5,3,0,0,0,0,0,1,2,0,0,0,7,0,0,0,0,4,0,0,5,0,0,0,0,6,0,0,0,0,3,6,0,7,0,0,0,2,0,4,4,0,0,0,0,2,0,0,0,0,9,0,0,5,0,0,0,0,1,0,0,0,9,6,0,0,0,0,0,4,3,0,0,8,9,0];
				case "level_933":
					return [0,0,0,3,0,0,0,6,0,7,5,0,6,8,0,0,2,0,0,0,0,2,0,0,7,0,0,0,0,4,0,0,0,0,0,1,3,0,0,0,0,0,0,0,6,5,0,0,0,0,0,9,0,0,0,0,3,0,0,2,0,0,0,0,1,0,0,7,9,0,8,3,0,9,0,0,0,4,0,0,0];
				case "level_934":
					return [4,0,0,8,0,6,0,0,3,0,6,0,9,0,0,8,0,0,0,7,0,0,0,4,0,0,0,3,4,0,0,0,0,0,9,0,8,0,0,0,0,0,0,0,7,0,9,0,0,0,0,0,3,5,0,0,0,6,0,0,0,1,0,0,0,4,0,0,3,0,6,0,1,0,0,4,0,5,0,0,9];
				case "level_935":
					return [0,0,0,0,8,0,0,0,6,0,2,0,0,0,7,0,5,0,0,0,3,6,0,0,2,0,0,8,0,0,7,0,0,0,3,4,0,0,4,0,0,0,7,0,0,2,3,0,0,0,6,0,0,8,0,0,2,0,0,8,3,0,0,0,7,0,2,0,0,0,9,0,1,0,0,0,6,0,0,0,0];
				case "level_936":
					return [3,0,0,0,5,0,0,0,0,0,4,0,0,8,0,2,0,5,0,0,7,0,0,0,0,1,0,7,0,0,0,2,4,0,0,0,0,0,3,0,1,0,9,0,0,0,0,0,5,6,0,0,0,4,0,6,0,0,0,0,7,0,0,8,0,1,0,9,0,0,5,0,0,0,0,0,7,0,0,0,9];
				case "level_937":
					return [0,0,0,4,0,0,3,0,0,7,0,0,8,0,0,0,2,0,0,0,0,0,5,0,4,0,0,8,0,7,5,0,0,0,1,0,1,0,0,0,7,0,0,0,5,0,4,0,0,0,9,8,0,6,0,0,2,0,1,0,0,0,0,0,8,0,0,0,5,0,0,2,0,0,1,0,0,4,0,0,0];
				case "level_938":
					return [0,2,4,0,5,0,0,0,3,0,0,0,1,0,0,0,0,4,0,0,8,0,0,2,0,6,0,5,0,0,0,0,4,0,0,0,0,3,0,5,0,7,0,8,0,0,0,0,8,0,0,0,0,5,0,7,0,2,0,0,1,0,0,9,0,0,0,0,6,0,0,0,1,0,0,0,8,0,7,3,0];
				case "level_939":
					return [6,0,0,7,4,0,0,0,0,0,0,3,0,8,9,0,1,0,0,2,0,0,0,0,0,4,0,9,0,4,2,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0,4,5,0,1,0,8,0,0,0,0,0,3,0,0,7,0,4,9,0,8,0,0,0,0,0,0,5,6,0,0,7];
				case "level_940":
					return [0,0,3,0,0,8,0,9,0,6,0,0,0,0,0,0,0,0,0,0,5,0,7,0,3,0,0,0,8,9,3,0,0,0,0,2,0,0,0,8,0,5,0,0,0,1,0,0,0,0,9,4,3,0,0,0,1,0,6,0,5,0,0,0,0,0,0,0,0,0,0,4,0,2,0,4,0,0,7,0,0];
				case "level_941":
					return [2,0,0,0,0,3,0,0,0,0,9,0,0,0,0,7,0,0,0,6,3,0,0,7,0,0,0,0,0,0,0,6,5,0,0,9,0,2,6,0,1,0,8,4,0,8,0,0,2,3,0,0,0,0,0,0,0,9,0,0,4,2,0,0,0,7,0,0,0,0,8,0,0,0,0,5,0,0,0,0,1];
				case "level_942":
					return [8,0,3,4,0,7,0,0,0,0,0,1,0,0,3,0,0,0,5,6,0,0,1,0,0,0,0,0,4,0,0,0,8,6,0,0,0,0,9,0,0,0,1,0,0,0,0,2,7,0,0,0,4,0,0,0,0,0,9,0,0,6,5,0,0,0,3,0,0,4,0,0,0,0,0,6,0,4,8,0,9];
				case "level_943":
					return [0,0,0,0,0,3,0,2,1,0,0,0,0,6,2,0,8,0,0,9,0,0,8,0,0,0,6,0,0,1,0,0,0,6,0,0,3,5,0,0,0,0,0,9,4,0,0,4,0,0,0,8,0,0,7,0,0,0,1,0,0,3,0,0,2,0,8,7,0,0,0,0,5,1,0,4,0,0,0,0,0];
				case "level_944":
					return [0,0,0,0,6,0,0,3,0,0,0,0,8,1,0,5,0,0,8,4,0,0,0,3,0,0,9,0,0,0,2,0,0,9,0,0,5,0,2,0,0,0,6,0,1,0,0,6,0,0,1,0,0,0,6,0,0,9,0,0,0,7,4,0,0,8,0,7,2,0,0,0,0,7,0,0,3,0,0,0,0];
				case "level_945":
					return [6,0,1,0,0,7,0,0,0,0,5,0,0,2,0,0,0,6,0,0,0,0,0,0,0,8,9,0,3,0,1,9,0,5,0,0,7,0,0,0,0,0,0,0,2,0,0,8,0,7,2,0,3,0,1,2,0,0,0,0,0,0,0,3,0,0,0,6,0,0,9,0,0,0,0,7,0,0,4,0,8];
				case "level_946":
					return [0,3,0,0,0,7,0,0,0,4,0,1,0,2,0,0,0,0,0,0,2,0,4,0,0,0,8,0,0,0,0,0,6,8,5,0,0,0,0,5,3,9,0,0,0,0,6,7,1,0,0,0,0,0,8,0,0,0,9,0,5,0,0,0,0,0,0,1,0,9,0,7,0,0,0,4,0,0,0,1,0];
				case "level_947":
					return [0,0,0,8,0,6,0,0,0,2,8,0,0,5,0,0,0,0,9,0,1,0,0,0,0,0,0,0,0,8,0,2,0,0,0,7,0,4,0,3,6,9,0,5,0,6,0,0,0,7,0,1,0,0,0,0,0,0,0,0,9,0,2,0,0,0,0,3,0,0,1,5,0,0,0,5,0,4,0,0,0];
				case "level_948":
					return [0,0,9,0,0,5,0,0,0,0,0,3,0,4,0,6,0,0,0,0,0,0,0,0,0,3,2,0,3,0,1,0,0,0,8,0,8,0,5,0,9,0,2,0,6,0,9,0,0,0,6,0,7,0,1,5,0,0,0,0,0,0,0,0,0,4,0,2,0,7,0,0,0,0,0,9,0,0,5,0,0];
				case "level_949":
					return [0,7,0,0,6,9,0,0,0,0,9,0,0,0,0,5,1,0,0,0,0,4,0,0,0,0,6,2,8,6,0,0,0,0,0,0,0,3,0,0,0,0,0,7,0,0,0,0,0,0,0,4,5,2,7,0,0,0,0,5,0,0,0,0,2,8,0,0,0,0,3,0,0,0,0,1,8,0,0,6,0];
				case "level_950":
					return [0,0,0,9,0,8,0,0,3,0,6,0,0,5,0,0,8,0,0,0,8,0,0,6,7,0,0,0,2,0,7,0,0,8,0,0,9,0,0,0,0,0,0,0,2,0,0,7,0,0,2,0,9,0,0,0,1,6,0,0,4,0,0,0,8,0,0,7,0,0,6,0,2,0,0,5,0,9,0,0,0];
				case "level_951":
					return [1,0,0,0,6,0,0,0,0,0,6,0,0,1,0,2,3,0,5,0,0,9,0,3,0,0,0,0,0,2,0,0,6,0,0,0,0,4,0,0,7,0,0,1,0,0,0,0,8,0,0,7,0,0,0,0,0,5,0,7,0,0,2,0,5,7,0,2,0,0,4,0,0,0,0,0,9,0,0,0,8];
				case "level_952":
					return [0,0,4,0,8,2,0,0,0,0,6,0,0,0,0,4,0,0,5,0,0,7,0,9,0,8,0,0,9,0,0,0,0,2,0,0,7,0,0,0,2,0,0,0,8,0,0,6,0,0,0,0,1,0,0,3,0,2,0,5,0,0,4,0,0,5,0,0,0,0,3,0,0,0,0,8,7,0,9,0,0];
				case "level_953":
					return [0,0,1,0,6,0,0,0,0,0,2,0,1,0,0,0,0,0,0,5,8,0,0,7,0,0,0,1,0,0,0,3,0,0,0,4,0,0,4,8,7,9,3,0,0,7,0,0,0,5,0,0,0,6,0,0,0,9,0,0,4,8,0,0,0,0,0,0,2,0,5,0,0,0,0,0,4,0,2,0,0];
				case "level_954":
					return [0,0,0,9,0,0,0,0,0,4,0,0,0,0,0,3,7,0,0,2,0,5,0,4,6,0,1,0,0,0,0,5,0,1,0,0,6,0,9,0,0,0,7,0,3,0,0,3,0,4,0,0,0,0,1,0,5,8,0,7,0,6,0,0,7,6,0,0,0,0,0,2,0,0,0,0,0,6,0,0,0];
				case "level_955":
					return [9,0,3,0,0,0,0,4,0,4,0,0,0,1,6,0,0,0,0,6,0,0,2,0,3,0,0,0,0,0,0,0,5,8,0,0,8,3,0,0,0,0,0,2,6,0,0,6,2,0,0,0,0,0,0,0,8,0,5,0,0,9,0,0,0,0,8,9,0,0,0,1,0,4,0,0,0,0,7,0,5];
				case "level_956":
					return [0,9,0,0,1,0,0,0,0,4,0,0,0,2,3,0,0,0,0,0,6,9,0,0,3,8,0,6,0,0,0,0,7,0,0,0,1,0,2,0,0,0,4,0,7,0,0,0,2,0,0,0,0,1,0,5,8,0,0,6,1,0,0,0,0,0,7,5,0,0,0,3,0,0,0,0,9,0,0,5,0];
				case "level_957":
					return [0,0,0,2,1,0,3,0,0,0,9,0,0,0,7,0,0,0,1,0,8,0,0,0,6,0,0,0,0,0,0,0,0,7,8,4,0,0,6,0,0,0,9,0,0,3,8,1,0,0,0,0,0,0,0,0,5,0,0,0,2,0,7,0,0,0,4,0,0,0,3,0,0,0,9,0,3,5,0,0,0];
				case "level_958":
					return [0,0,7,6,0,1,9,0,0,1,0,0,5,7,0,0,2,0,0,3,0,0,0,0,0,0,0,8,0,6,0,1,0,0,0,0,0,7,0,0,0,0,0,3,0,0,0,0,0,8,0,2,0,5,0,0,0,0,0,0,0,5,0,0,5,0,0,3,2,0,0,9,0,0,8,9,0,6,3,0,0];
				case "level_959":
					return [0,0,9,0,0,0,0,0,6,0,0,0,0,6,0,0,5,0,8,7,0,0,5,0,2,0,0,0,0,0,2,9,0,0,1,0,3,0,0,0,8,0,0,0,5,0,6,0,0,4,1,0,0,0,0,0,1,0,7,0,0,2,4,0,3,0,0,2,0,0,0,0,6,0,0,0,0,0,8,0,0];
				case "level_960":
					return [0,7,4,0,0,0,0,0,0,0,0,0,9,0,5,0,0,0,3,5,0,0,2,0,0,0,0,0,0,3,0,8,0,0,6,0,5,0,0,4,6,2,0,0,9,0,8,0,0,7,0,1,0,0,0,0,0,0,5,0,0,7,1,0,0,0,6,0,1,0,0,0,0,0,0,0,0,0,3,4,0];
				case "level_961":
					return [5,0,0,2,0,0,0,0,0,3,0,7,0,0,0,6,1,0,9,0,4,0,0,3,0,7,0,7,0,0,0,0,1,0,0,0,0,0,0,4,0,8,0,0,0,0,0,0,6,0,0,0,0,4,0,7,0,1,0,0,2,0,6,0,5,9,0,0,0,3,0,8,0,0,0,0,0,9,0,0,7];
				case "level_962":
					return [5,4,0,7,3,0,2,0,0,0,1,0,0,0,4,3,0,5,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,6,0,0,0,3,0,8,0,6,0,9,0,0,0,7,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,9,0,2,6,0,0,0,8,0,0,0,4,0,7,1,0,2,6];
				case "level_963":
					return [3,0,8,0,0,6,0,0,0,0,0,0,0,0,0,0,0,3,2,6,9,0,0,4,0,0,7,0,8,0,0,4,7,0,0,0,0,0,2,0,0,0,9,0,0,0,0,0,5,1,0,0,8,0,5,0,0,4,0,0,1,3,9,4,0,0,0,0,0,0,0,0,0,0,0,1,0,0,5,0,4];
				case "level_964":
					return [0,8,0,0,0,5,0,0,0,0,9,0,0,4,0,0,0,0,6,0,0,8,9,0,0,0,2,0,0,7,2,0,0,0,1,0,5,0,4,0,0,0,7,0,8,0,3,0,0,0,1,9,0,0,4,0,0,0,2,8,0,0,7,0,0,0,0,1,0,0,5,0,0,0,0,5,0,0,0,3,0];
				case "level_965":
					return [0,0,5,0,4,3,0,0,7,0,1,0,7,0,8,0,4,0,0,0,0,0,0,0,2,0,0,0,0,0,0,7,0,0,8,6,0,0,2,0,0,0,4,0,0,3,5,0,0,6,0,0,0,0,0,0,3,0,0,0,0,0,0,0,2,0,8,0,1,0,6,0,1,0,0,5,2,0,3,0,0];
				case "level_966":
					return [0,0,0,0,0,6,0,4,0,0,2,4,0,0,0,0,9,3,0,0,0,0,9,0,0,5,8,1,3,0,2,0,0,0,0,0,0,0,0,3,0,5,0,0,0,0,0,0,0,0,8,0,3,5,6,9,0,0,7,0,0,0,0,4,7,0,0,0,0,3,8,0,0,1,0,6,0,0,0,0,0];
				case "level_967":
					return [9,0,0,1,0,0,4,0,0,0,0,7,0,5,0,0,0,0,0,6,0,0,0,9,0,0,7,0,0,5,0,0,0,2,8,0,0,8,0,0,2,0,0,5,0,0,2,1,0,0,0,7,0,0,6,0,0,2,0,0,0,1,0,0,0,0,0,8,0,6,0,0,0,0,8,0,0,3,0,0,4];
				case "level_968":
					return [0,5,0,0,0,8,0,0,0,0,0,0,6,0,0,3,0,0,4,0,2,7,0,0,0,0,8,0,0,0,2,6,0,9,0,0,1,0,0,0,0,0,0,0,5,0,0,6,0,4,7,0,0,0,2,0,0,0,0,9,1,0,4,0,0,7,0,0,2,0,0,0,0,0,0,3,0,0,0,9,0];
				case "level_969":
					return [0,0,8,1,0,0,7,5,0,9,0,0,0,5,6,0,0,0,0,5,0,0,4,0,0,0,0,8,0,0,0,0,2,0,0,0,6,0,3,0,0,0,2,0,8,0,0,0,6,0,0,0,0,1,0,0,0,0,8,0,0,4,0,0,0,0,9,2,0,0,0,3,0,7,9,0,0,4,1,0,0];
				case "level_970":
					return [0,0,0,0,0,0,0,0,7,0,0,0,0,0,5,4,2,0,0,0,0,3,7,9,8,1,0,2,0,5,0,0,0,0,7,0,0,0,0,5,0,4,0,0,0,0,9,0,0,0,0,6,0,3,0,4,1,8,9,3,0,0,0,0,3,7,4,0,0,0,0,0,6,0,0,0,0,0,0,0,0];
				case "level_971":
					return [0,0,7,5,0,0,0,0,2,0,6,0,0,1,0,5,0,9,0,9,0,0,0,3,0,0,0,0,0,0,9,0,0,0,1,0,0,0,2,8,0,1,6,0,0,0,1,0,0,0,2,0,0,0,0,0,0,7,0,0,0,4,0,8,0,6,0,2,0,0,3,0,3,0,0,0,0,5,8,0,0];
				case "level_972":
					return [0,0,0,2,0,0,1,0,4,0,0,0,0,5,0,6,0,0,0,0,0,0,0,6,0,0,7,0,3,0,0,9,0,0,6,0,0,0,9,8,2,1,3,0,0,0,5,0,0,4,0,0,2,0,4,0,0,7,0,0,0,0,0,0,0,7,0,3,0,0,0,0,1,0,3,0,0,8,0,0,0];
				case "level_973":
					return [1,0,0,0,0,3,0,0,5,0,0,0,0,6,0,0,9,0,0,0,4,2,0,0,3,0,0,0,2,0,6,0,0,0,3,4,0,0,5,0,0,0,8,0,0,4,8,0,0,0,5,0,2,0,0,0,3,0,0,6,4,0,0,0,6,0,0,2,0,0,0,0,7,0,0,5,0,0,0,0,3];
				case "level_974":
					return [0,0,3,0,0,0,0,0,5,0,0,0,0,7,9,0,0,3,0,7,0,0,4,0,0,1,0,0,0,0,0,0,0,0,0,7,6,2,1,0,8,0,9,3,4,4,0,0,0,0,0,0,0,0,0,5,0,0,9,0,0,8,0,9,0,0,8,2,0,0,0,0,7,0,0,0,0,0,2,0,0];
				case "level_975":
					return [4,0,0,9,0,0,0,0,5,0,0,0,0,0,0,3,9,0,0,0,8,7,0,0,0,0,0,2,8,0,5,0,9,0,0,0,0,0,4,0,6,0,9,0,0,0,0,0,1,0,2,0,4,7,0,0,0,0,0,3,6,0,0,0,5,1,0,0,0,0,0,0,3,0,0,0,0,1,0,0,2];
				case "level_976":
					return [0,9,0,0,7,3,0,0,0,0,0,0,0,0,4,5,1,0,0,0,0,0,0,0,0,0,8,0,0,2,1,0,0,4,0,5,0,0,3,0,0,0,6,0,0,6,0,5,0,0,9,7,0,0,8,0,0,0,0,0,0,0,0,0,5,4,7,0,0,0,0,0,0,0,0,5,2,0,0,7,0];
				case "level_977":
					return [7,0,5,0,0,6,0,0,0,0,0,0,0,0,0,0,0,7,8,2,6,0,0,7,0,0,5,0,1,0,0,6,5,0,0,0,0,0,8,0,0,0,9,0,0,0,0,0,4,7,0,0,1,0,4,0,0,7,0,0,8,3,9,2,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1,0,2];
				case "level_978":
					return [0,0,0,7,0,3,0,5,0,1,0,0,0,0,0,0,3,0,7,0,3,0,0,0,2,6,0,0,0,0,6,0,0,0,0,9,0,1,0,0,0,0,0,2,0,4,0,0,0,0,5,0,0,0,0,2,9,0,0,0,6,0,4,0,6,0,0,0,0,0,0,5,0,4,0,8,0,1,0,0,0];
				case "level_979":
					return [0,0,0,0,0,0,8,0,5,0,0,9,0,0,2,3,6,0,4,0,0,0,0,5,0,0,0,9,2,0,4,0,6,0,0,0,0,1,0,0,0,0,0,2,0,0,0,0,2,0,3,0,7,8,0,0,0,6,0,0,0,0,2,0,4,6,5,0,0,7,0,0,7,0,3,0,0,0,0,0,0];
				case "level_980":
					return [0,3,0,4,7,0,9,0,0,0,0,0,0,8,2,0,0,1,0,8,0,0,0,0,0,6,0,0,0,0,0,0,6,8,0,4,0,0,0,0,2,0,0,0,0,3,0,5,8,0,0,0,0,0,0,9,0,0,0,0,0,7,0,2,0,0,1,5,0,0,0,0,0,0,7,0,4,8,0,2,0];
				case "level_981":
					return [6,0,0,0,7,0,9,0,0,5,0,7,8,0,0,0,0,0,0,0,3,4,6,0,0,0,0,0,8,0,0,0,0,0,4,0,9,0,5,0,0,0,2,0,8,0,7,0,0,0,0,0,1,0,0,0,0,0,1,3,4,0,0,0,0,0,0,0,9,3,0,7,0,0,2,0,4,0,0,0,1];
				case "level_982":
					return [0,0,0,0,0,0,0,6,5,0,0,6,0,0,1,0,0,0,0,0,8,0,7,0,9,0,0,0,8,0,4,0,0,0,1,0,4,0,7,0,1,0,6,0,2,0,2,0,0,0,5,0,3,0,0,0,4,0,9,0,3,0,0,0,0,0,6,0,0,1,0,0,7,3,0,0,0,0,0,0,0];
				case "level_983":
					return [2,0,0,0,0,7,0,0,0,0,9,3,0,8,0,0,0,0,5,8,0,2,0,3,0,0,0,0,0,2,0,0,4,0,0,1,6,0,0,0,0,0,0,0,8,3,0,0,5,0,0,2,0,0,0,0,0,4,0,2,0,5,7,0,0,0,0,6,0,3,9,0,0,0,0,7,0,0,0,0,6];
				case "level_984":
					return [0,0,0,2,0,0,0,0,0,1,0,0,4,0,9,6,3,0,0,0,9,0,0,0,0,8,5,0,0,0,0,4,0,0,6,0,0,2,3,0,0,0,8,5,0,0,8,0,0,9,0,0,0,0,5,3,0,0,0,0,1,0,0,0,4,6,7,0,5,0,0,3,0,0,0,0,0,3,0,0,0];
				case "level_985":
					return [5,8,0,0,7,0,0,0,0,0,6,0,0,8,0,0,0,4,0,0,7,0,0,9,0,0,0,0,0,0,0,0,7,1,5,0,0,0,0,8,2,6,0,0,0,0,4,6,1,0,0,0,0,0,0,0,0,5,0,0,2,0,0,4,0,0,0,9,0,0,3,0,0,0,0,0,3,0,0,7,9];
				case "level_986":
					return [4,0,0,0,0,6,0,3,0,0,0,0,0,4,0,0,0,2,0,2,0,8,0,0,5,0,0,5,0,8,0,0,0,0,0,7,0,0,4,0,8,0,9,0,0,9,0,0,0,0,0,4,0,8,0,0,2,0,0,1,0,7,0,7,0,0,0,9,0,0,0,0,0,1,0,5,0,0,0,0,3];
				case "level_987":
					return [0,0,6,3,0,0,0,0,0,7,0,1,0,0,0,2,8,0,3,0,9,0,1,0,0,0,0,0,0,0,0,0,2,8,0,4,0,0,0,8,0,4,0,0,0,6,0,8,5,0,0,0,0,0,0,0,0,0,9,0,4,0,2,0,7,5,0,0,0,9,0,8,0,0,0,0,0,3,7,0,0];
				case "level_988":
					return [1,4,0,0,0,0,0,0,0,0,0,0,0,0,9,0,2,0,0,0,8,0,0,1,7,0,0,0,0,0,1,0,8,3,0,2,0,1,0,0,6,0,0,7,0,7,0,9,3,0,5,0,0,0,0,0,3,5,0,0,4,0,0,0,6,0,4,0,0,0,0,0,0,0,0,0,0,0,0,5,8];
				case "level_989":
					return [0,0,0,8,7,0,0,1,0,0,2,4,0,0,0,0,8,0,7,0,0,0,0,9,0,0,0,0,0,0,0,0,0,7,3,6,0,1,0,0,0,0,0,5,0,6,4,9,0,0,0,0,0,0,0,0,0,4,0,0,0,0,1,0,5,0,0,0,0,3,6,0,0,7,0,0,3,2,0,0,0];
				case "level_990":
					return [0,0,0,4,0,0,0,8,0,0,0,0,5,0,0,0,0,2,0,9,2,8,6,0,0,3,0,8,0,0,0,0,0,1,0,0,0,0,7,0,0,0,2,0,0,0,0,3,0,0,0,0,0,4,0,5,0,0,9,7,6,1,0,6,0,0,0,0,5,0,0,0,0,7,0,0,0,2,0,0,0];
				case "level_991":
					return [1,8,0,2,0,0,0,0,0,0,0,0,0,9,3,0,8,7,5,0,0,0,0,0,0,4,0,6,0,0,0,3,0,0,2,0,0,2,0,0,0,0,0,9,0,0,7,0,0,6,0,0,0,8,0,6,0,0,0,0,0,0,4,3,1,0,8,5,0,0,0,0,0,0,0,0,0,6,0,1,9];
				case "level_992":
					return [0,8,0,0,0,7,0,9,0,0,0,0,0,0,0,0,0,6,0,7,4,0,0,6,8,1,0,5,0,0,2,9,0,0,6,0,0,0,0,0,0,0,0,0,0,0,9,0,0,6,5,0,0,1,0,1,7,6,0,0,4,3,0,9,0,0,0,0,0,0,0,0,0,4,0,7,0,0,0,8,0];
				case "level_993":
					return [8,0,0,5,0,0,1,0,0,0,0,4,0,1,0,0,0,5,0,0,0,0,8,0,2,4,0,0,8,0,6,0,0,0,0,0,3,2,0,0,0,0,0,9,6,0,0,0,0,0,3,0,5,0,0,9,3,0,5,0,0,0,0,2,0,0,0,6,0,4,0,0,0,0,7,0,0,8,0,0,1];
				case "level_994":
					return [0,0,1,0,0,8,0,0,0,9,0,0,0,0,0,0,2,0,7,8,0,0,0,2,0,0,0,0,0,0,0,7,3,9,0,0,1,7,0,0,4,0,0,5,6,0,0,5,1,8,0,0,0,0,0,0,0,9,0,0,0,6,1,0,2,0,0,0,0,0,0,5,0,0,0,3,0,0,4,0,0];
				case "level_995":
					return [0,6,0,0,0,0,8,0,0,0,0,4,0,3,9,0,0,0,2,0,0,8,0,5,0,6,0,0,1,0,0,0,0,7,0,0,9,0,0,0,5,0,0,0,3,0,0,5,0,0,0,0,4,0,0,9,0,4,0,3,0,0,8,0,0,0,5,9,0,2,0,0,0,0,2,0,0,0,0,7,0];
				case "level_996":
					return [0,0,0,5,0,9,8,0,0,0,2,0,0,0,0,9,0,0,9,5,0,0,0,0,6,0,7,0,0,0,6,0,0,0,3,0,0,0,2,0,0,0,7,0,0,0,4,0,0,0,8,0,0,0,3,0,7,0,0,0,0,4,6,0,0,6,0,0,0,0,8,0,0,0,4,1,0,2,0,0,0];
				case "level_997":
					return [0,0,5,0,0,0,0,6,0,7,0,0,0,2,0,0,0,9,0,0,0,0,7,8,0,5,0,0,0,0,0,0,0,0,7,0,1,3,9,0,4,0,8,2,5,0,2,0,0,0,0,0,0,0,0,8,0,4,1,0,0,0,0,6,0,0,0,8,0,0,0,4,0,7,0,0,0,0,1,0,0];
				case "level_998":
					return [0,8,0,0,7,0,0,0,3,0,7,0,0,0,5,0,0,0,0,0,2,0,0,4,9,0,0,0,0,0,7,0,9,6,0,8,0,0,0,0,3,0,0,0,0,4,0,7,2,0,6,0,0,0,0,0,5,9,0,0,8,0,0,0,0,0,1,0,0,0,2,0,1,0,0,0,5,0,0,6,0];
				case "level_999":
					return [0,0,0,5,7,8,0,0,3,0,0,5,0,0,0,0,0,1,0,0,0,0,0,3,0,4,0,0,0,0,2,0,0,9,0,8,0,0,6,0,0,0,5,0,0,5,0,3,0,0,1,0,0,0,0,4,0,7,0,0,0,0,0,3,0,0,0,0,0,2,0,0,8,0,0,3,9,6,0,0,0];
				case "level_1000":
					return [0,0,0,4,8,0,0,7,0,0,6,2,0,0,0,0,4,0,8,0,0,0,0,1,0,0,0,0,0,0,0,0,0,8,9,5,0,7,0,0,0,0,0,3,0,5,2,1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,7,0,3,0,0,0,0,9,5,0,0,8,0,0,9,6,0,0,0];
				default:
					break;
			}
		}

		function setUsedNumberPiecesArrForCurrentLevel(level_id, used_number_pieces_arr) {
			switch(level_id) {
				case "level_1":
					used_number_pieces_arr_for_level_1 = used_number_pieces_arr; break;
				case "level_2":
					used_number_pieces_arr_for_level_2 = used_number_pieces_arr; break;
				case "level_3":
					used_number_pieces_arr_for_level_3 = used_number_pieces_arr; break;
				case "level_4":
					used_number_pieces_arr_for_level_4 = used_number_pieces_arr; break;
				case "level_5":
					used_number_pieces_arr_for_level_5 = used_number_pieces_arr; break;
				case "level_6":
					used_number_pieces_arr_for_level_6 = used_number_pieces_arr; break;
				case "level_7":
					used_number_pieces_arr_for_level_7 = used_number_pieces_arr; break;
				case "level_8":
					used_number_pieces_arr_for_level_8 = used_number_pieces_arr; break;
				case "level_9":
					used_number_pieces_arr_for_level_9 = used_number_pieces_arr; break;
				case "level_10":
					used_number_pieces_arr_for_level_10 = used_number_pieces_arr; break;
				case "level_11":
					used_number_pieces_arr_for_level_11 = used_number_pieces_arr; break;
				case "level_12":
					used_number_pieces_arr_for_level_12 = used_number_pieces_arr; break;
				case "level_13":
					used_number_pieces_arr_for_level_13 = used_number_pieces_arr; break;
				case "level_14":
					used_number_pieces_arr_for_level_14 = used_number_pieces_arr; break;
				case "level_15":
					used_number_pieces_arr_for_level_15 = used_number_pieces_arr; break;
				case "level_16":
					used_number_pieces_arr_for_level_16 = used_number_pieces_arr; break;
				case "level_17":
					used_number_pieces_arr_for_level_17 = used_number_pieces_arr; break;
				case "level_18":
					used_number_pieces_arr_for_level_18 = used_number_pieces_arr; break;
				case "level_19":
					used_number_pieces_arr_for_level_19 = used_number_pieces_arr; break;
				case "level_20":
					used_number_pieces_arr_for_level_20 = used_number_pieces_arr; break;
				case "level_21":
					used_number_pieces_arr_for_level_21 = used_number_pieces_arr; break;
				case "level_22":
					used_number_pieces_arr_for_level_22 = used_number_pieces_arr; break;
				case "level_23":
					used_number_pieces_arr_for_level_23 = used_number_pieces_arr; break;
				case "level_24":
					used_number_pieces_arr_for_level_24 = used_number_pieces_arr; break;
				case "level_25":
					used_number_pieces_arr_for_level_25 = used_number_pieces_arr; break;
				case "level_26":
					used_number_pieces_arr_for_level_26 = used_number_pieces_arr; break;
				case "level_27":
					used_number_pieces_arr_for_level_27 = used_number_pieces_arr; break;
				case "level_28":
					used_number_pieces_arr_for_level_28 = used_number_pieces_arr; break;
				case "level_29":
					used_number_pieces_arr_for_level_29 = used_number_pieces_arr; break;
				case "level_30":
					used_number_pieces_arr_for_level_30 = used_number_pieces_arr; break;
				case "level_31":
					used_number_pieces_arr_for_level_31 = used_number_pieces_arr; break;
				case "level_32":
					used_number_pieces_arr_for_level_32 = used_number_pieces_arr; break;
				case "level_33":
					used_number_pieces_arr_for_level_33 = used_number_pieces_arr; break;
				case "level_34":
					used_number_pieces_arr_for_level_34 = used_number_pieces_arr; break;
				case "level_35":
					used_number_pieces_arr_for_level_35 = used_number_pieces_arr; break;
				case "level_36":
					used_number_pieces_arr_for_level_36 = used_number_pieces_arr; break;
				case "level_37":
					used_number_pieces_arr_for_level_37 = used_number_pieces_arr; break;
				case "level_38":
					used_number_pieces_arr_for_level_38 = used_number_pieces_arr; break;
				case "level_39":
					used_number_pieces_arr_for_level_39 = used_number_pieces_arr; break;
				case "level_40":
					used_number_pieces_arr_for_level_40 = used_number_pieces_arr; break;
				case "level_41":
					used_number_pieces_arr_for_level_41 = used_number_pieces_arr; break;
				case "level_42":
					used_number_pieces_arr_for_level_42 = used_number_pieces_arr; break;
				case "level_43":
					used_number_pieces_arr_for_level_43 = used_number_pieces_arr; break;
				case "level_44":
					used_number_pieces_arr_for_level_44 = used_number_pieces_arr; break;
				case "level_45":
					used_number_pieces_arr_for_level_45 = used_number_pieces_arr; break;
				case "level_46":
					used_number_pieces_arr_for_level_46 = used_number_pieces_arr; break;
				case "level_47":
					used_number_pieces_arr_for_level_47 = used_number_pieces_arr; break;
				case "level_48":
					used_number_pieces_arr_for_level_48 = used_number_pieces_arr; break;
				case "level_49":
					used_number_pieces_arr_for_level_49 = used_number_pieces_arr; break;
				case "level_50":
					used_number_pieces_arr_for_level_50 = used_number_pieces_arr; break;
				case "level_51":
					used_number_pieces_arr_for_level_51 = used_number_pieces_arr; break;
				case "level_52":
					used_number_pieces_arr_for_level_52 = used_number_pieces_arr; break;
				case "level_53":
					used_number_pieces_arr_for_level_53 = used_number_pieces_arr; break;
				case "level_54":
					used_number_pieces_arr_for_level_54 = used_number_pieces_arr; break;
				case "level_55":
					used_number_pieces_arr_for_level_55 = used_number_pieces_arr; break;
				case "level_56":
					used_number_pieces_arr_for_level_56 = used_number_pieces_arr; break;
				case "level_57":
					used_number_pieces_arr_for_level_57 = used_number_pieces_arr; break;
				case "level_58":
					used_number_pieces_arr_for_level_58 = used_number_pieces_arr; break;
				case "level_59":
					used_number_pieces_arr_for_level_59 = used_number_pieces_arr; break;
				case "level_60":
					used_number_pieces_arr_for_level_60 = used_number_pieces_arr; break;
				case "level_61":
					used_number_pieces_arr_for_level_61 = used_number_pieces_arr; break;
				case "level_62":
					used_number_pieces_arr_for_level_62 = used_number_pieces_arr; break;
				case "level_63":
					used_number_pieces_arr_for_level_63 = used_number_pieces_arr; break;
				case "level_64":
					used_number_pieces_arr_for_level_64 = used_number_pieces_arr; break;
				case "level_65":
					used_number_pieces_arr_for_level_65 = used_number_pieces_arr; break;
				case "level_66":
					used_number_pieces_arr_for_level_66 = used_number_pieces_arr; break;
				case "level_67":
					used_number_pieces_arr_for_level_67 = used_number_pieces_arr; break;
				case "level_68":
					used_number_pieces_arr_for_level_68 = used_number_pieces_arr; break;
				case "level_69":
					used_number_pieces_arr_for_level_69 = used_number_pieces_arr; break;
				case "level_70":
					used_number_pieces_arr_for_level_70 = used_number_pieces_arr; break;
				case "level_71":
					used_number_pieces_arr_for_level_71 = used_number_pieces_arr; break;
				case "level_72":
					used_number_pieces_arr_for_level_72 = used_number_pieces_arr; break;
				case "level_73":
					used_number_pieces_arr_for_level_73 = used_number_pieces_arr; break;
				case "level_74":
					used_number_pieces_arr_for_level_74 = used_number_pieces_arr; break;
				case "level_75":
					used_number_pieces_arr_for_level_75 = used_number_pieces_arr; break;
				case "level_76":
					used_number_pieces_arr_for_level_76 = used_number_pieces_arr; break;
				case "level_77":
					used_number_pieces_arr_for_level_77 = used_number_pieces_arr; break;
				case "level_78":
					used_number_pieces_arr_for_level_78 = used_number_pieces_arr; break;
				case "level_79":
					used_number_pieces_arr_for_level_79 = used_number_pieces_arr; break;
				case "level_80":
					used_number_pieces_arr_for_level_80 = used_number_pieces_arr; break;
				case "level_81":
					used_number_pieces_arr_for_level_81 = used_number_pieces_arr; break;
				case "level_82":
					used_number_pieces_arr_for_level_82 = used_number_pieces_arr; break;
				case "level_83":
					used_number_pieces_arr_for_level_83 = used_number_pieces_arr; break;
				case "level_84":
					used_number_pieces_arr_for_level_84 = used_number_pieces_arr; break;
				case "level_85":
					used_number_pieces_arr_for_level_85 = used_number_pieces_arr; break;
				case "level_86":
					used_number_pieces_arr_for_level_86 = used_number_pieces_arr; break;
				case "level_87":
					used_number_pieces_arr_for_level_87 = used_number_pieces_arr; break;
				case "level_88":
					used_number_pieces_arr_for_level_88 = used_number_pieces_arr; break;
				case "level_89":
					used_number_pieces_arr_for_level_89 = used_number_pieces_arr; break;
				case "level_90":
					used_number_pieces_arr_for_level_90 = used_number_pieces_arr; break;
				case "level_91":
					used_number_pieces_arr_for_level_91 = used_number_pieces_arr; break;
				case "level_92":
					used_number_pieces_arr_for_level_92 = used_number_pieces_arr; break;
				case "level_93":
					used_number_pieces_arr_for_level_93 = used_number_pieces_arr; break;
				case "level_94":
					used_number_pieces_arr_for_level_94 = used_number_pieces_arr; break;
				case "level_95":
					used_number_pieces_arr_for_level_95 = used_number_pieces_arr; break;
				case "level_96":
					used_number_pieces_arr_for_level_96 = used_number_pieces_arr; break;
				case "level_97":
					used_number_pieces_arr_for_level_97 = used_number_pieces_arr; break;
				case "level_98":
					used_number_pieces_arr_for_level_98 = used_number_pieces_arr; break;
				case "level_99":
					used_number_pieces_arr_for_level_99 = used_number_pieces_arr; break;
				case "level_100":
					used_number_pieces_arr_for_level_100 = used_number_pieces_arr; break;
				case "level_101":
					used_number_pieces_arr_for_level_101 = used_number_pieces_arr; break;
				case "level_102":
					used_number_pieces_arr_for_level_102 = used_number_pieces_arr; break;
				case "level_103":
					used_number_pieces_arr_for_level_103 = used_number_pieces_arr; break;
				case "level_104":
					used_number_pieces_arr_for_level_104 = used_number_pieces_arr; break;
				case "level_105":
					used_number_pieces_arr_for_level_105 = used_number_pieces_arr; break;
				case "level_106":
					used_number_pieces_arr_for_level_106 = used_number_pieces_arr; break;
				case "level_107":
					used_number_pieces_arr_for_level_107 = used_number_pieces_arr; break;
				case "level_108":
					used_number_pieces_arr_for_level_108 = used_number_pieces_arr; break;
				case "level_109":
					used_number_pieces_arr_for_level_109 = used_number_pieces_arr; break;
				case "level_110":
					used_number_pieces_arr_for_level_110 = used_number_pieces_arr; break;
				case "level_111":
					used_number_pieces_arr_for_level_111 = used_number_pieces_arr; break;
				case "level_112":
					used_number_pieces_arr_for_level_112 = used_number_pieces_arr; break;
				case "level_113":
					used_number_pieces_arr_for_level_113 = used_number_pieces_arr; break;
				case "level_114":
					used_number_pieces_arr_for_level_114 = used_number_pieces_arr; break;
				case "level_115":
					used_number_pieces_arr_for_level_115 = used_number_pieces_arr; break;
				case "level_116":
					used_number_pieces_arr_for_level_116 = used_number_pieces_arr; break;
				case "level_117":
					used_number_pieces_arr_for_level_117 = used_number_pieces_arr; break;
				case "level_118":
					used_number_pieces_arr_for_level_118 = used_number_pieces_arr; break;
				case "level_119":
					used_number_pieces_arr_for_level_119 = used_number_pieces_arr; break;
				case "level_120":
					used_number_pieces_arr_for_level_120 = used_number_pieces_arr; break;
				case "level_121":
					used_number_pieces_arr_for_level_121 = used_number_pieces_arr; break;
				case "level_122":
					used_number_pieces_arr_for_level_122 = used_number_pieces_arr; break;
				case "level_123":
					used_number_pieces_arr_for_level_123 = used_number_pieces_arr; break;
				case "level_124":
					used_number_pieces_arr_for_level_124 = used_number_pieces_arr; break;
				case "level_125":
					used_number_pieces_arr_for_level_125 = used_number_pieces_arr; break;
				case "level_126":
					used_number_pieces_arr_for_level_126 = used_number_pieces_arr; break;
				case "level_127":
					used_number_pieces_arr_for_level_127 = used_number_pieces_arr; break;
				case "level_128":
					used_number_pieces_arr_for_level_128 = used_number_pieces_arr; break;
				case "level_129":
					used_number_pieces_arr_for_level_129 = used_number_pieces_arr; break;
				case "level_130":
					used_number_pieces_arr_for_level_130 = used_number_pieces_arr; break;
				case "level_131":
					used_number_pieces_arr_for_level_131 = used_number_pieces_arr; break;
				case "level_132":
					used_number_pieces_arr_for_level_132 = used_number_pieces_arr; break;
				case "level_133":
					used_number_pieces_arr_for_level_133 = used_number_pieces_arr; break;
				case "level_134":
					used_number_pieces_arr_for_level_134 = used_number_pieces_arr; break;
				case "level_135":
					used_number_pieces_arr_for_level_135 = used_number_pieces_arr; break;
				case "level_136":
					used_number_pieces_arr_for_level_136 = used_number_pieces_arr; break;
				case "level_137":
					used_number_pieces_arr_for_level_137 = used_number_pieces_arr; break;
				case "level_138":
					used_number_pieces_arr_for_level_138 = used_number_pieces_arr; break;
				case "level_139":
					used_number_pieces_arr_for_level_139 = used_number_pieces_arr; break;
				case "level_140":
					used_number_pieces_arr_for_level_140 = used_number_pieces_arr; break;
				case "level_141":
					used_number_pieces_arr_for_level_141 = used_number_pieces_arr; break;
				case "level_142":
					used_number_pieces_arr_for_level_142 = used_number_pieces_arr; break;
				case "level_143":
					used_number_pieces_arr_for_level_143 = used_number_pieces_arr; break;
				case "level_144":
					used_number_pieces_arr_for_level_144 = used_number_pieces_arr; break;
				case "level_145":
					used_number_pieces_arr_for_level_145 = used_number_pieces_arr; break;
				case "level_146":
					used_number_pieces_arr_for_level_146 = used_number_pieces_arr; break;
				case "level_147":
					used_number_pieces_arr_for_level_147 = used_number_pieces_arr; break;
				case "level_148":
					used_number_pieces_arr_for_level_148 = used_number_pieces_arr; break;
				case "level_149":
					used_number_pieces_arr_for_level_149 = used_number_pieces_arr; break;
				case "level_150":
					used_number_pieces_arr_for_level_150 = used_number_pieces_arr; break;
				case "level_151":
					used_number_pieces_arr_for_level_151 = used_number_pieces_arr; break;
				case "level_152":
					used_number_pieces_arr_for_level_152 = used_number_pieces_arr; break;
				case "level_153":
					used_number_pieces_arr_for_level_153 = used_number_pieces_arr; break;
				case "level_154":
					used_number_pieces_arr_for_level_154 = used_number_pieces_arr; break;
				case "level_155":
					used_number_pieces_arr_for_level_155 = used_number_pieces_arr; break;
				case "level_156":
					used_number_pieces_arr_for_level_156 = used_number_pieces_arr; break;
				case "level_157":
					used_number_pieces_arr_for_level_157 = used_number_pieces_arr; break;
				case "level_158":
					used_number_pieces_arr_for_level_158 = used_number_pieces_arr; break;
				case "level_159":
					used_number_pieces_arr_for_level_159 = used_number_pieces_arr; break;
				case "level_160":
					used_number_pieces_arr_for_level_160 = used_number_pieces_arr; break;
				case "level_161":
					used_number_pieces_arr_for_level_161 = used_number_pieces_arr; break;
				case "level_162":
					used_number_pieces_arr_for_level_162 = used_number_pieces_arr; break;
				case "level_163":
					used_number_pieces_arr_for_level_163 = used_number_pieces_arr; break;
				case "level_164":
					used_number_pieces_arr_for_level_164 = used_number_pieces_arr; break;
				case "level_165":
					used_number_pieces_arr_for_level_165 = used_number_pieces_arr; break;
				case "level_166":
					used_number_pieces_arr_for_level_166 = used_number_pieces_arr; break;
				case "level_167":
					used_number_pieces_arr_for_level_167 = used_number_pieces_arr; break;
				case "level_168":
					used_number_pieces_arr_for_level_168 = used_number_pieces_arr; break;
				case "level_169":
					used_number_pieces_arr_for_level_169 = used_number_pieces_arr; break;
				case "level_170":
					used_number_pieces_arr_for_level_170 = used_number_pieces_arr; break;
				case "level_171":
					used_number_pieces_arr_for_level_171 = used_number_pieces_arr; break;
				case "level_172":
					used_number_pieces_arr_for_level_172 = used_number_pieces_arr; break;
				case "level_173":
					used_number_pieces_arr_for_level_173 = used_number_pieces_arr; break;
				case "level_174":
					used_number_pieces_arr_for_level_174 = used_number_pieces_arr; break;
				case "level_175":
					used_number_pieces_arr_for_level_175 = used_number_pieces_arr; break;
				case "level_176":
					used_number_pieces_arr_for_level_176 = used_number_pieces_arr; break;
				case "level_177":
					used_number_pieces_arr_for_level_177 = used_number_pieces_arr; break;
				case "level_178":
					used_number_pieces_arr_for_level_178 = used_number_pieces_arr; break;
				case "level_179":
					used_number_pieces_arr_for_level_179 = used_number_pieces_arr; break;
				case "level_180":
					used_number_pieces_arr_for_level_180 = used_number_pieces_arr; break;
				case "level_181":
					used_number_pieces_arr_for_level_181 = used_number_pieces_arr; break;
				case "level_182":
					used_number_pieces_arr_for_level_182 = used_number_pieces_arr; break;
				case "level_183":
					used_number_pieces_arr_for_level_183 = used_number_pieces_arr; break;
				case "level_184":
					used_number_pieces_arr_for_level_184 = used_number_pieces_arr; break;
				case "level_185":
					used_number_pieces_arr_for_level_185 = used_number_pieces_arr; break;
				case "level_186":
					used_number_pieces_arr_for_level_186 = used_number_pieces_arr; break;
				case "level_187":
					used_number_pieces_arr_for_level_187 = used_number_pieces_arr; break;
				case "level_188":
					used_number_pieces_arr_for_level_188 = used_number_pieces_arr; break;
				case "level_189":
					used_number_pieces_arr_for_level_189 = used_number_pieces_arr; break;
				case "level_190":
					used_number_pieces_arr_for_level_190 = used_number_pieces_arr; break;
				case "level_191":
					used_number_pieces_arr_for_level_191 = used_number_pieces_arr; break;
				case "level_192":
					used_number_pieces_arr_for_level_192 = used_number_pieces_arr; break;
				case "level_193":
					used_number_pieces_arr_for_level_193 = used_number_pieces_arr; break;
				case "level_194":
					used_number_pieces_arr_for_level_194 = used_number_pieces_arr; break;
				case "level_195":
					used_number_pieces_arr_for_level_195 = used_number_pieces_arr; break;
				case "level_196":
					used_number_pieces_arr_for_level_196 = used_number_pieces_arr; break;
				case "level_197":
					used_number_pieces_arr_for_level_197 = used_number_pieces_arr; break;
				case "level_198":
					used_number_pieces_arr_for_level_198 = used_number_pieces_arr; break;
				case "level_199":
					used_number_pieces_arr_for_level_199 = used_number_pieces_arr; break;
				case "level_200":
					used_number_pieces_arr_for_level_200 = used_number_pieces_arr; break;
				case "level_201":
					used_number_pieces_arr_for_level_201 = used_number_pieces_arr; break;
				case "level_202":
					used_number_pieces_arr_for_level_202 = used_number_pieces_arr; break;
				case "level_203":
					used_number_pieces_arr_for_level_203 = used_number_pieces_arr; break;
				case "level_204":
					used_number_pieces_arr_for_level_204 = used_number_pieces_arr; break;
				case "level_205":
					used_number_pieces_arr_for_level_205 = used_number_pieces_arr; break;
				case "level_206":
					used_number_pieces_arr_for_level_206 = used_number_pieces_arr; break;
				case "level_207":
					used_number_pieces_arr_for_level_207 = used_number_pieces_arr; break;
				case "level_208":
					used_number_pieces_arr_for_level_208 = used_number_pieces_arr; break;
				case "level_209":
					used_number_pieces_arr_for_level_209 = used_number_pieces_arr; break;
				case "level_210":
					used_number_pieces_arr_for_level_210 = used_number_pieces_arr; break;
				case "level_211":
					used_number_pieces_arr_for_level_211 = used_number_pieces_arr; break;
				case "level_212":
					used_number_pieces_arr_for_level_212 = used_number_pieces_arr; break;
				case "level_213":
					used_number_pieces_arr_for_level_213 = used_number_pieces_arr; break;
				case "level_214":
					used_number_pieces_arr_for_level_214 = used_number_pieces_arr; break;
				case "level_215":
					used_number_pieces_arr_for_level_215 = used_number_pieces_arr; break;
				case "level_216":
					used_number_pieces_arr_for_level_216 = used_number_pieces_arr; break;
				case "level_217":
					used_number_pieces_arr_for_level_217 = used_number_pieces_arr; break;
				case "level_218":
					used_number_pieces_arr_for_level_218 = used_number_pieces_arr; break;
				case "level_219":
					used_number_pieces_arr_for_level_219 = used_number_pieces_arr; break;
				case "level_220":
					used_number_pieces_arr_for_level_220 = used_number_pieces_arr; break;
				case "level_221":
					used_number_pieces_arr_for_level_221 = used_number_pieces_arr; break;
				case "level_222":
					used_number_pieces_arr_for_level_222 = used_number_pieces_arr; break;
				case "level_223":
					used_number_pieces_arr_for_level_223 = used_number_pieces_arr; break;
				case "level_224":
					used_number_pieces_arr_for_level_224 = used_number_pieces_arr; break;
				case "level_225":
					used_number_pieces_arr_for_level_225 = used_number_pieces_arr; break;
				case "level_226":
					used_number_pieces_arr_for_level_226 = used_number_pieces_arr; break;
				case "level_227":
					used_number_pieces_arr_for_level_227 = used_number_pieces_arr; break;
				case "level_228":
					used_number_pieces_arr_for_level_228 = used_number_pieces_arr; break;
				case "level_229":
					used_number_pieces_arr_for_level_229 = used_number_pieces_arr; break;
				case "level_230":
					used_number_pieces_arr_for_level_230 = used_number_pieces_arr; break;
				case "level_231":
					used_number_pieces_arr_for_level_231 = used_number_pieces_arr; break;
				case "level_232":
					used_number_pieces_arr_for_level_232 = used_number_pieces_arr; break;
				case "level_233":
					used_number_pieces_arr_for_level_233 = used_number_pieces_arr; break;
				case "level_234":
					used_number_pieces_arr_for_level_234 = used_number_pieces_arr; break;
				case "level_235":
					used_number_pieces_arr_for_level_235 = used_number_pieces_arr; break;
				case "level_236":
					used_number_pieces_arr_for_level_236 = used_number_pieces_arr; break;
				case "level_237":
					used_number_pieces_arr_for_level_237 = used_number_pieces_arr; break;
				case "level_238":
					used_number_pieces_arr_for_level_238 = used_number_pieces_arr; break;
				case "level_239":
					used_number_pieces_arr_for_level_239 = used_number_pieces_arr; break;
				case "level_240":
					used_number_pieces_arr_for_level_240 = used_number_pieces_arr; break;
				case "level_241":
					used_number_pieces_arr_for_level_241 = used_number_pieces_arr; break;
				case "level_242":
					used_number_pieces_arr_for_level_242 = used_number_pieces_arr; break;
				case "level_243":
					used_number_pieces_arr_for_level_243 = used_number_pieces_arr; break;
				case "level_244":
					used_number_pieces_arr_for_level_244 = used_number_pieces_arr; break;
				case "level_245":
					used_number_pieces_arr_for_level_245 = used_number_pieces_arr; break;
				case "level_246":
					used_number_pieces_arr_for_level_246 = used_number_pieces_arr; break;
				case "level_247":
					used_number_pieces_arr_for_level_247 = used_number_pieces_arr; break;
				case "level_248":
					used_number_pieces_arr_for_level_248 = used_number_pieces_arr; break;
				case "level_249":
					used_number_pieces_arr_for_level_249 = used_number_pieces_arr; break;
				case "level_250":
					used_number_pieces_arr_for_level_250 = used_number_pieces_arr; break;
				case "level_251":
					used_number_pieces_arr_for_level_251 = used_number_pieces_arr; break;
				case "level_252":
					used_number_pieces_arr_for_level_252 = used_number_pieces_arr; break;
				case "level_253":
					used_number_pieces_arr_for_level_253 = used_number_pieces_arr; break;
				case "level_254":
					used_number_pieces_arr_for_level_254 = used_number_pieces_arr; break;
				case "level_255":
					used_number_pieces_arr_for_level_255 = used_number_pieces_arr; break;
				case "level_256":
					used_number_pieces_arr_for_level_256 = used_number_pieces_arr; break;
				case "level_257":
					used_number_pieces_arr_for_level_257 = used_number_pieces_arr; break;
				case "level_258":
					used_number_pieces_arr_for_level_258 = used_number_pieces_arr; break;
				case "level_259":
					used_number_pieces_arr_for_level_259 = used_number_pieces_arr; break;
				case "level_260":
					used_number_pieces_arr_for_level_260 = used_number_pieces_arr; break;
				case "level_261":
					used_number_pieces_arr_for_level_261 = used_number_pieces_arr; break;
				case "level_262":
					used_number_pieces_arr_for_level_262 = used_number_pieces_arr; break;
				case "level_263":
					used_number_pieces_arr_for_level_263 = used_number_pieces_arr; break;
				case "level_264":
					used_number_pieces_arr_for_level_264 = used_number_pieces_arr; break;
				case "level_265":
					used_number_pieces_arr_for_level_265 = used_number_pieces_arr; break;
				case "level_266":
					used_number_pieces_arr_for_level_266 = used_number_pieces_arr; break;
				case "level_267":
					used_number_pieces_arr_for_level_267 = used_number_pieces_arr; break;
				case "level_268":
					used_number_pieces_arr_for_level_268 = used_number_pieces_arr; break;
				case "level_269":
					used_number_pieces_arr_for_level_269 = used_number_pieces_arr; break;
				case "level_270":
					used_number_pieces_arr_for_level_270 = used_number_pieces_arr; break;
				case "level_271":
					used_number_pieces_arr_for_level_271 = used_number_pieces_arr; break;
				case "level_272":
					used_number_pieces_arr_for_level_272 = used_number_pieces_arr; break;
				case "level_273":
					used_number_pieces_arr_for_level_273 = used_number_pieces_arr; break;
				case "level_274":
					used_number_pieces_arr_for_level_274 = used_number_pieces_arr; break;
				case "level_275":
					used_number_pieces_arr_for_level_275 = used_number_pieces_arr; break;
				case "level_276":
					used_number_pieces_arr_for_level_276 = used_number_pieces_arr; break;
				case "level_277":
					used_number_pieces_arr_for_level_277 = used_number_pieces_arr; break;
				case "level_278":
					used_number_pieces_arr_for_level_278 = used_number_pieces_arr; break;
				case "level_279":
					used_number_pieces_arr_for_level_279 = used_number_pieces_arr; break;
				case "level_280":
					used_number_pieces_arr_for_level_280 = used_number_pieces_arr; break;
				case "level_281":
					used_number_pieces_arr_for_level_281 = used_number_pieces_arr; break;
				case "level_282":
					used_number_pieces_arr_for_level_282 = used_number_pieces_arr; break;
				case "level_283":
					used_number_pieces_arr_for_level_283 = used_number_pieces_arr; break;
				case "level_284":
					used_number_pieces_arr_for_level_284 = used_number_pieces_arr; break;
				case "level_285":
					used_number_pieces_arr_for_level_285 = used_number_pieces_arr; break;
				case "level_286":
					used_number_pieces_arr_for_level_286 = used_number_pieces_arr; break;
				case "level_287":
					used_number_pieces_arr_for_level_287 = used_number_pieces_arr; break;
				case "level_288":
					used_number_pieces_arr_for_level_288 = used_number_pieces_arr; break;
				case "level_289":
					used_number_pieces_arr_for_level_289 = used_number_pieces_arr; break;
				case "level_290":
					used_number_pieces_arr_for_level_290 = used_number_pieces_arr; break;
				case "level_291":
					used_number_pieces_arr_for_level_291 = used_number_pieces_arr; break;
				case "level_292":
					used_number_pieces_arr_for_level_292 = used_number_pieces_arr; break;
				case "level_293":
					used_number_pieces_arr_for_level_293 = used_number_pieces_arr; break;
				case "level_294":
					used_number_pieces_arr_for_level_294 = used_number_pieces_arr; break;
				case "level_295":
					used_number_pieces_arr_for_level_295 = used_number_pieces_arr; break;
				case "level_296":
					used_number_pieces_arr_for_level_296 = used_number_pieces_arr; break;
				case "level_297":
					used_number_pieces_arr_for_level_297 = used_number_pieces_arr; break;
				case "level_298":
					used_number_pieces_arr_for_level_298 = used_number_pieces_arr; break;
				case "level_299":
					used_number_pieces_arr_for_level_299 = used_number_pieces_arr; break;
				case "level_300":
					used_number_pieces_arr_for_level_300 = used_number_pieces_arr; break;
				case "level_301":
					used_number_pieces_arr_for_level_301 = used_number_pieces_arr; break;
				case "level_302":
					used_number_pieces_arr_for_level_302 = used_number_pieces_arr; break;
				case "level_303":
					used_number_pieces_arr_for_level_303 = used_number_pieces_arr; break;
				case "level_304":
					used_number_pieces_arr_for_level_304 = used_number_pieces_arr; break;
				case "level_305":
					used_number_pieces_arr_for_level_305 = used_number_pieces_arr; break;
				case "level_306":
					used_number_pieces_arr_for_level_306 = used_number_pieces_arr; break;
				case "level_307":
					used_number_pieces_arr_for_level_307 = used_number_pieces_arr; break;
				case "level_308":
					used_number_pieces_arr_for_level_308 = used_number_pieces_arr; break;
				case "level_309":
					used_number_pieces_arr_for_level_309 = used_number_pieces_arr; break;
				case "level_310":
					used_number_pieces_arr_for_level_310 = used_number_pieces_arr; break;
				case "level_311":
					used_number_pieces_arr_for_level_311 = used_number_pieces_arr; break;
				case "level_312":
					used_number_pieces_arr_for_level_312 = used_number_pieces_arr; break;
				case "level_313":
					used_number_pieces_arr_for_level_313 = used_number_pieces_arr; break;
				case "level_314":
					used_number_pieces_arr_for_level_314 = used_number_pieces_arr; break;
				case "level_315":
					used_number_pieces_arr_for_level_315 = used_number_pieces_arr; break;
				case "level_316":
					used_number_pieces_arr_for_level_316 = used_number_pieces_arr; break;
				case "level_317":
					used_number_pieces_arr_for_level_317 = used_number_pieces_arr; break;
				case "level_318":
					used_number_pieces_arr_for_level_318 = used_number_pieces_arr; break;
				case "level_319":
					used_number_pieces_arr_for_level_319 = used_number_pieces_arr; break;
				case "level_320":
					used_number_pieces_arr_for_level_320 = used_number_pieces_arr; break;
				case "level_321":
					used_number_pieces_arr_for_level_321 = used_number_pieces_arr; break;
				case "level_322":
					used_number_pieces_arr_for_level_322 = used_number_pieces_arr; break;
				case "level_323":
					used_number_pieces_arr_for_level_323 = used_number_pieces_arr; break;
				case "level_324":
					used_number_pieces_arr_for_level_324 = used_number_pieces_arr; break;
				case "level_325":
					used_number_pieces_arr_for_level_325 = used_number_pieces_arr; break;
				case "level_326":
					used_number_pieces_arr_for_level_326 = used_number_pieces_arr; break;
				case "level_327":
					used_number_pieces_arr_for_level_327 = used_number_pieces_arr; break;
				case "level_328":
					used_number_pieces_arr_for_level_328 = used_number_pieces_arr; break;
				case "level_329":
					used_number_pieces_arr_for_level_329 = used_number_pieces_arr; break;
				case "level_330":
					used_number_pieces_arr_for_level_330 = used_number_pieces_arr; break;
				case "level_331":
					used_number_pieces_arr_for_level_331 = used_number_pieces_arr; break;
				case "level_332":
					used_number_pieces_arr_for_level_332 = used_number_pieces_arr; break;
				case "level_333":
					used_number_pieces_arr_for_level_333 = used_number_pieces_arr; break;
				case "level_334":
					used_number_pieces_arr_for_level_334 = used_number_pieces_arr; break;
				case "level_335":
					used_number_pieces_arr_for_level_335 = used_number_pieces_arr; break;
				case "level_336":
					used_number_pieces_arr_for_level_336 = used_number_pieces_arr; break;
				case "level_337":
					used_number_pieces_arr_for_level_337 = used_number_pieces_arr; break;
				case "level_338":
					used_number_pieces_arr_for_level_338 = used_number_pieces_arr; break;
				case "level_339":
					used_number_pieces_arr_for_level_339 = used_number_pieces_arr; break;
				case "level_340":
					used_number_pieces_arr_for_level_340 = used_number_pieces_arr; break;
				case "level_341":
					used_number_pieces_arr_for_level_341 = used_number_pieces_arr; break;
				case "level_342":
					used_number_pieces_arr_for_level_342 = used_number_pieces_arr; break;
				case "level_343":
					used_number_pieces_arr_for_level_343 = used_number_pieces_arr; break;
				case "level_344":
					used_number_pieces_arr_for_level_344 = used_number_pieces_arr; break;
				case "level_345":
					used_number_pieces_arr_for_level_345 = used_number_pieces_arr; break;
				case "level_346":
					used_number_pieces_arr_for_level_346 = used_number_pieces_arr; break;
				case "level_347":
					used_number_pieces_arr_for_level_347 = used_number_pieces_arr; break;
				case "level_348":
					used_number_pieces_arr_for_level_348 = used_number_pieces_arr; break;
				case "level_349":
					used_number_pieces_arr_for_level_349 = used_number_pieces_arr; break;
				case "level_350":
					used_number_pieces_arr_for_level_350 = used_number_pieces_arr; break;
				case "level_351":
					used_number_pieces_arr_for_level_351 = used_number_pieces_arr; break;
				case "level_352":
					used_number_pieces_arr_for_level_352 = used_number_pieces_arr; break;
				case "level_353":
					used_number_pieces_arr_for_level_353 = used_number_pieces_arr; break;
				case "level_354":
					used_number_pieces_arr_for_level_354 = used_number_pieces_arr; break;
				case "level_355":
					used_number_pieces_arr_for_level_355 = used_number_pieces_arr; break;
				case "level_356":
					used_number_pieces_arr_for_level_356 = used_number_pieces_arr; break;
				case "level_357":
					used_number_pieces_arr_for_level_357 = used_number_pieces_arr; break;
				case "level_358":
					used_number_pieces_arr_for_level_358 = used_number_pieces_arr; break;
				case "level_359":
					used_number_pieces_arr_for_level_359 = used_number_pieces_arr; break;
				case "level_360":
					used_number_pieces_arr_for_level_360 = used_number_pieces_arr; break;
				case "level_361":
					used_number_pieces_arr_for_level_361 = used_number_pieces_arr; break;
				case "level_362":
					used_number_pieces_arr_for_level_362 = used_number_pieces_arr; break;
				case "level_363":
					used_number_pieces_arr_for_level_363 = used_number_pieces_arr; break;
				case "level_364":
					used_number_pieces_arr_for_level_364 = used_number_pieces_arr; break;
				case "level_365":
					used_number_pieces_arr_for_level_365 = used_number_pieces_arr; break;
				case "level_366":
					used_number_pieces_arr_for_level_366 = used_number_pieces_arr; break;
				case "level_367":
					used_number_pieces_arr_for_level_367 = used_number_pieces_arr; break;
				case "level_368":
					used_number_pieces_arr_for_level_368 = used_number_pieces_arr; break;
				case "level_369":
					used_number_pieces_arr_for_level_369 = used_number_pieces_arr; break;
				case "level_370":
					used_number_pieces_arr_for_level_370 = used_number_pieces_arr; break;
				case "level_371":
					used_number_pieces_arr_for_level_371 = used_number_pieces_arr; break;
				case "level_372":
					used_number_pieces_arr_for_level_372 = used_number_pieces_arr; break;
				case "level_373":
					used_number_pieces_arr_for_level_373 = used_number_pieces_arr; break;
				case "level_374":
					used_number_pieces_arr_for_level_374 = used_number_pieces_arr; break;
				case "level_375":
					used_number_pieces_arr_for_level_375 = used_number_pieces_arr; break;
				case "level_376":
					used_number_pieces_arr_for_level_376 = used_number_pieces_arr; break;
				case "level_377":
					used_number_pieces_arr_for_level_377 = used_number_pieces_arr; break;
				case "level_378":
					used_number_pieces_arr_for_level_378 = used_number_pieces_arr; break;
				case "level_379":
					used_number_pieces_arr_for_level_379 = used_number_pieces_arr; break;
				case "level_380":
					used_number_pieces_arr_for_level_380 = used_number_pieces_arr; break;
				case "level_381":
					used_number_pieces_arr_for_level_381 = used_number_pieces_arr; break;
				case "level_382":
					used_number_pieces_arr_for_level_382 = used_number_pieces_arr; break;
				case "level_383":
					used_number_pieces_arr_for_level_383 = used_number_pieces_arr; break;
				case "level_384":
					used_number_pieces_arr_for_level_384 = used_number_pieces_arr; break;
				case "level_385":
					used_number_pieces_arr_for_level_385 = used_number_pieces_arr; break;
				case "level_386":
					used_number_pieces_arr_for_level_386 = used_number_pieces_arr; break;
				case "level_387":
					used_number_pieces_arr_for_level_387 = used_number_pieces_arr; break;
				case "level_388":
					used_number_pieces_arr_for_level_388 = used_number_pieces_arr; break;
				case "level_389":
					used_number_pieces_arr_for_level_389 = used_number_pieces_arr; break;
				case "level_390":
					used_number_pieces_arr_for_level_390 = used_number_pieces_arr; break;
				case "level_391":
					used_number_pieces_arr_for_level_391 = used_number_pieces_arr; break;
				case "level_392":
					used_number_pieces_arr_for_level_392 = used_number_pieces_arr; break;
				case "level_393":
					used_number_pieces_arr_for_level_393 = used_number_pieces_arr; break;
				case "level_394":
					used_number_pieces_arr_for_level_394 = used_number_pieces_arr; break;
				case "level_395":
					used_number_pieces_arr_for_level_395 = used_number_pieces_arr; break;
				case "level_396":
					used_number_pieces_arr_for_level_396 = used_number_pieces_arr; break;
				case "level_397":
					used_number_pieces_arr_for_level_397 = used_number_pieces_arr; break;
				case "level_398":
					used_number_pieces_arr_for_level_398 = used_number_pieces_arr; break;
				case "level_399":
					used_number_pieces_arr_for_level_399 = used_number_pieces_arr; break;
				case "level_400":
					used_number_pieces_arr_for_level_400 = used_number_pieces_arr; break;
				case "level_401":
					used_number_pieces_arr_for_level_401 = used_number_pieces_arr; break;
				case "level_402":
					used_number_pieces_arr_for_level_402 = used_number_pieces_arr; break;
				case "level_403":
					used_number_pieces_arr_for_level_403 = used_number_pieces_arr; break;
				case "level_404":
					used_number_pieces_arr_for_level_404 = used_number_pieces_arr; break;
				case "level_405":
					used_number_pieces_arr_for_level_405 = used_number_pieces_arr; break;
				case "level_406":
					used_number_pieces_arr_for_level_406 = used_number_pieces_arr; break;
				case "level_407":
					used_number_pieces_arr_for_level_407 = used_number_pieces_arr; break;
				case "level_408":
					used_number_pieces_arr_for_level_408 = used_number_pieces_arr; break;
				case "level_409":
					used_number_pieces_arr_for_level_409 = used_number_pieces_arr; break;
				case "level_410":
					used_number_pieces_arr_for_level_410 = used_number_pieces_arr; break;
				case "level_411":
					used_number_pieces_arr_for_level_411 = used_number_pieces_arr; break;
				case "level_412":
					used_number_pieces_arr_for_level_412 = used_number_pieces_arr; break;
				case "level_413":
					used_number_pieces_arr_for_level_413 = used_number_pieces_arr; break;
				case "level_414":
					used_number_pieces_arr_for_level_414 = used_number_pieces_arr; break;
				case "level_415":
					used_number_pieces_arr_for_level_415 = used_number_pieces_arr; break;
				case "level_416":
					used_number_pieces_arr_for_level_416 = used_number_pieces_arr; break;
				case "level_417":
					used_number_pieces_arr_for_level_417 = used_number_pieces_arr; break;
				case "level_418":
					used_number_pieces_arr_for_level_418 = used_number_pieces_arr; break;
				case "level_419":
					used_number_pieces_arr_for_level_419 = used_number_pieces_arr; break;
				case "level_420":
					used_number_pieces_arr_for_level_420 = used_number_pieces_arr; break;
				case "level_421":
					used_number_pieces_arr_for_level_421 = used_number_pieces_arr; break;
				case "level_422":
					used_number_pieces_arr_for_level_422 = used_number_pieces_arr; break;
				case "level_423":
					used_number_pieces_arr_for_level_423 = used_number_pieces_arr; break;
				case "level_424":
					used_number_pieces_arr_for_level_424 = used_number_pieces_arr; break;
				case "level_425":
					used_number_pieces_arr_for_level_425 = used_number_pieces_arr; break;
				case "level_426":
					used_number_pieces_arr_for_level_426 = used_number_pieces_arr; break;
				case "level_427":
					used_number_pieces_arr_for_level_427 = used_number_pieces_arr; break;
				case "level_428":
					used_number_pieces_arr_for_level_428 = used_number_pieces_arr; break;
				case "level_429":
					used_number_pieces_arr_for_level_429 = used_number_pieces_arr; break;
				case "level_430":
					used_number_pieces_arr_for_level_430 = used_number_pieces_arr; break;
				case "level_431":
					used_number_pieces_arr_for_level_431 = used_number_pieces_arr; break;
				case "level_432":
					used_number_pieces_arr_for_level_432 = used_number_pieces_arr; break;
				case "level_433":
					used_number_pieces_arr_for_level_433 = used_number_pieces_arr; break;
				case "level_434":
					used_number_pieces_arr_for_level_434 = used_number_pieces_arr; break;
				case "level_435":
					used_number_pieces_arr_for_level_435 = used_number_pieces_arr; break;
				case "level_436":
					used_number_pieces_arr_for_level_436 = used_number_pieces_arr; break;
				case "level_437":
					used_number_pieces_arr_for_level_437 = used_number_pieces_arr; break;
				case "level_438":
					used_number_pieces_arr_for_level_438 = used_number_pieces_arr; break;
				case "level_439":
					used_number_pieces_arr_for_level_439 = used_number_pieces_arr; break;
				case "level_440":
					used_number_pieces_arr_for_level_440 = used_number_pieces_arr; break;
				case "level_441":
					used_number_pieces_arr_for_level_441 = used_number_pieces_arr; break;
				case "level_442":
					used_number_pieces_arr_for_level_442 = used_number_pieces_arr; break;
				case "level_443":
					used_number_pieces_arr_for_level_443 = used_number_pieces_arr; break;
				case "level_444":
					used_number_pieces_arr_for_level_444 = used_number_pieces_arr; break;
				case "level_445":
					used_number_pieces_arr_for_level_445 = used_number_pieces_arr; break;
				case "level_446":
					used_number_pieces_arr_for_level_446 = used_number_pieces_arr; break;
				case "level_447":
					used_number_pieces_arr_for_level_447 = used_number_pieces_arr; break;
				case "level_448":
					used_number_pieces_arr_for_level_448 = used_number_pieces_arr; break;
				case "level_449":
					used_number_pieces_arr_for_level_449 = used_number_pieces_arr; break;
				case "level_450":
					used_number_pieces_arr_for_level_450 = used_number_pieces_arr; break;
				case "level_451":
					used_number_pieces_arr_for_level_451 = used_number_pieces_arr; break;
				case "level_452":
					used_number_pieces_arr_for_level_452 = used_number_pieces_arr; break;
				case "level_453":
					used_number_pieces_arr_for_level_453 = used_number_pieces_arr; break;
				case "level_454":
					used_number_pieces_arr_for_level_454 = used_number_pieces_arr; break;
				case "level_455":
					used_number_pieces_arr_for_level_455 = used_number_pieces_arr; break;
				case "level_456":
					used_number_pieces_arr_for_level_456 = used_number_pieces_arr; break;
				case "level_457":
					used_number_pieces_arr_for_level_457 = used_number_pieces_arr; break;
				case "level_458":
					used_number_pieces_arr_for_level_458 = used_number_pieces_arr; break;
				case "level_459":
					used_number_pieces_arr_for_level_459 = used_number_pieces_arr; break;
				case "level_460":
					used_number_pieces_arr_for_level_460 = used_number_pieces_arr; break;
				case "level_461":
					used_number_pieces_arr_for_level_461 = used_number_pieces_arr; break;
				case "level_462":
					used_number_pieces_arr_for_level_462 = used_number_pieces_arr; break;
				case "level_463":
					used_number_pieces_arr_for_level_463 = used_number_pieces_arr; break;
				case "level_464":
					used_number_pieces_arr_for_level_464 = used_number_pieces_arr; break;
				case "level_465":
					used_number_pieces_arr_for_level_465 = used_number_pieces_arr; break;
				case "level_466":
					used_number_pieces_arr_for_level_466 = used_number_pieces_arr; break;
				case "level_467":
					used_number_pieces_arr_for_level_467 = used_number_pieces_arr; break;
				case "level_468":
					used_number_pieces_arr_for_level_468 = used_number_pieces_arr; break;
				case "level_469":
					used_number_pieces_arr_for_level_469 = used_number_pieces_arr; break;
				case "level_470":
					used_number_pieces_arr_for_level_470 = used_number_pieces_arr; break;
				case "level_471":
					used_number_pieces_arr_for_level_471 = used_number_pieces_arr; break;
				case "level_472":
					used_number_pieces_arr_for_level_472 = used_number_pieces_arr; break;
				case "level_473":
					used_number_pieces_arr_for_level_473 = used_number_pieces_arr; break;
				case "level_474":
					used_number_pieces_arr_for_level_474 = used_number_pieces_arr; break;
				case "level_475":
					used_number_pieces_arr_for_level_475 = used_number_pieces_arr; break;
				case "level_476":
					used_number_pieces_arr_for_level_476 = used_number_pieces_arr; break;
				case "level_477":
					used_number_pieces_arr_for_level_477 = used_number_pieces_arr; break;
				case "level_478":
					used_number_pieces_arr_for_level_478 = used_number_pieces_arr; break;
				case "level_479":
					used_number_pieces_arr_for_level_479 = used_number_pieces_arr; break;
				case "level_480":
					used_number_pieces_arr_for_level_480 = used_number_pieces_arr; break;
				case "level_481":
					used_number_pieces_arr_for_level_481 = used_number_pieces_arr; break;
				case "level_482":
					used_number_pieces_arr_for_level_482 = used_number_pieces_arr; break;
				case "level_483":
					used_number_pieces_arr_for_level_483 = used_number_pieces_arr; break;
				case "level_484":
					used_number_pieces_arr_for_level_484 = used_number_pieces_arr; break;
				case "level_485":
					used_number_pieces_arr_for_level_485 = used_number_pieces_arr; break;
				case "level_486":
					used_number_pieces_arr_for_level_486 = used_number_pieces_arr; break;
				case "level_487":
					used_number_pieces_arr_for_level_487 = used_number_pieces_arr; break;
				case "level_488":
					used_number_pieces_arr_for_level_488 = used_number_pieces_arr; break;
				case "level_489":
					used_number_pieces_arr_for_level_489 = used_number_pieces_arr; break;
				case "level_490":
					used_number_pieces_arr_for_level_490 = used_number_pieces_arr; break;
				case "level_491":
					used_number_pieces_arr_for_level_491 = used_number_pieces_arr; break;
				case "level_492":
					used_number_pieces_arr_for_level_492 = used_number_pieces_arr; break;
				case "level_493":
					used_number_pieces_arr_for_level_493 = used_number_pieces_arr; break;
				case "level_494":
					used_number_pieces_arr_for_level_494 = used_number_pieces_arr; break;
				case "level_495":
					used_number_pieces_arr_for_level_495 = used_number_pieces_arr; break;
				case "level_496":
					used_number_pieces_arr_for_level_496 = used_number_pieces_arr; break;
				case "level_497":
					used_number_pieces_arr_for_level_497 = used_number_pieces_arr; break;
				case "level_498":
					used_number_pieces_arr_for_level_498 = used_number_pieces_arr; break;
				case "level_499":
					used_number_pieces_arr_for_level_499 = used_number_pieces_arr; break;
				case "level_500":
					used_number_pieces_arr_for_level_500 = used_number_pieces_arr; break;
				case "level_501":
					used_number_pieces_arr_for_level_501 = used_number_pieces_arr; break;
				case "level_502":
					used_number_pieces_arr_for_level_502 = used_number_pieces_arr; break;
				case "level_503":
					used_number_pieces_arr_for_level_503 = used_number_pieces_arr; break;
				case "level_504":
					used_number_pieces_arr_for_level_504 = used_number_pieces_arr; break;
				case "level_505":
					used_number_pieces_arr_for_level_505 = used_number_pieces_arr; break;
				case "level_506":
					used_number_pieces_arr_for_level_506 = used_number_pieces_arr; break;
				case "level_507":
					used_number_pieces_arr_for_level_507 = used_number_pieces_arr; break;
				case "level_508":
					used_number_pieces_arr_for_level_508 = used_number_pieces_arr; break;
				case "level_509":
					used_number_pieces_arr_for_level_509 = used_number_pieces_arr; break;
				case "level_510":
					used_number_pieces_arr_for_level_510 = used_number_pieces_arr; break;
				case "level_511":
					used_number_pieces_arr_for_level_511 = used_number_pieces_arr; break;
				case "level_512":
					used_number_pieces_arr_for_level_512 = used_number_pieces_arr; break;
				case "level_513":
					used_number_pieces_arr_for_level_513 = used_number_pieces_arr; break;
				case "level_514":
					used_number_pieces_arr_for_level_514 = used_number_pieces_arr; break;
				case "level_515":
					used_number_pieces_arr_for_level_515 = used_number_pieces_arr; break;
				case "level_516":
					used_number_pieces_arr_for_level_516 = used_number_pieces_arr; break;
				case "level_517":
					used_number_pieces_arr_for_level_517 = used_number_pieces_arr; break;
				case "level_518":
					used_number_pieces_arr_for_level_518 = used_number_pieces_arr; break;
				case "level_519":
					used_number_pieces_arr_for_level_519 = used_number_pieces_arr; break;
				case "level_520":
					used_number_pieces_arr_for_level_520 = used_number_pieces_arr; break;
				case "level_521":
					used_number_pieces_arr_for_level_521 = used_number_pieces_arr; break;
				case "level_522":
					used_number_pieces_arr_for_level_522 = used_number_pieces_arr; break;
				case "level_523":
					used_number_pieces_arr_for_level_523 = used_number_pieces_arr; break;
				case "level_524":
					used_number_pieces_arr_for_level_524 = used_number_pieces_arr; break;
				case "level_525":
					used_number_pieces_arr_for_level_525 = used_number_pieces_arr; break;
				case "level_526":
					used_number_pieces_arr_for_level_526 = used_number_pieces_arr; break;
				case "level_527":
					used_number_pieces_arr_for_level_527 = used_number_pieces_arr; break;
				case "level_528":
					used_number_pieces_arr_for_level_528 = used_number_pieces_arr; break;
				case "level_529":
					used_number_pieces_arr_for_level_529 = used_number_pieces_arr; break;
				case "level_530":
					used_number_pieces_arr_for_level_530 = used_number_pieces_arr; break;
				case "level_531":
					used_number_pieces_arr_for_level_531 = used_number_pieces_arr; break;
				case "level_532":
					used_number_pieces_arr_for_level_532 = used_number_pieces_arr; break;
				case "level_533":
					used_number_pieces_arr_for_level_533 = used_number_pieces_arr; break;
				case "level_534":
					used_number_pieces_arr_for_level_534 = used_number_pieces_arr; break;
				case "level_535":
					used_number_pieces_arr_for_level_535 = used_number_pieces_arr; break;
				case "level_536":
					used_number_pieces_arr_for_level_536 = used_number_pieces_arr; break;
				case "level_537":
					used_number_pieces_arr_for_level_537 = used_number_pieces_arr; break;
				case "level_538":
					used_number_pieces_arr_for_level_538 = used_number_pieces_arr; break;
				case "level_539":
					used_number_pieces_arr_for_level_539 = used_number_pieces_arr; break;
				case "level_540":
					used_number_pieces_arr_for_level_540 = used_number_pieces_arr; break;
				case "level_541":
					used_number_pieces_arr_for_level_541 = used_number_pieces_arr; break;
				case "level_542":
					used_number_pieces_arr_for_level_542 = used_number_pieces_arr; break;
				case "level_543":
					used_number_pieces_arr_for_level_543 = used_number_pieces_arr; break;
				case "level_544":
					used_number_pieces_arr_for_level_544 = used_number_pieces_arr; break;
				case "level_545":
					used_number_pieces_arr_for_level_545 = used_number_pieces_arr; break;
				case "level_546":
					used_number_pieces_arr_for_level_546 = used_number_pieces_arr; break;
				case "level_547":
					used_number_pieces_arr_for_level_547 = used_number_pieces_arr; break;
				case "level_548":
					used_number_pieces_arr_for_level_548 = used_number_pieces_arr; break;
				case "level_549":
					used_number_pieces_arr_for_level_549 = used_number_pieces_arr; break;
				case "level_550":
					used_number_pieces_arr_for_level_550 = used_number_pieces_arr; break;
				case "level_551":
					used_number_pieces_arr_for_level_551 = used_number_pieces_arr; break;
				case "level_552":
					used_number_pieces_arr_for_level_552 = used_number_pieces_arr; break;
				case "level_553":
					used_number_pieces_arr_for_level_553 = used_number_pieces_arr; break;
				case "level_554":
					used_number_pieces_arr_for_level_554 = used_number_pieces_arr; break;
				case "level_555":
					used_number_pieces_arr_for_level_555 = used_number_pieces_arr; break;
				case "level_556":
					used_number_pieces_arr_for_level_556 = used_number_pieces_arr; break;
				case "level_557":
					used_number_pieces_arr_for_level_557 = used_number_pieces_arr; break;
				case "level_558":
					used_number_pieces_arr_for_level_558 = used_number_pieces_arr; break;
				case "level_559":
					used_number_pieces_arr_for_level_559 = used_number_pieces_arr; break;
				case "level_560":
					used_number_pieces_arr_for_level_560 = used_number_pieces_arr; break;
				case "level_561":
					used_number_pieces_arr_for_level_561 = used_number_pieces_arr; break;
				case "level_562":
					used_number_pieces_arr_for_level_562 = used_number_pieces_arr; break;
				case "level_563":
					used_number_pieces_arr_for_level_563 = used_number_pieces_arr; break;
				case "level_564":
					used_number_pieces_arr_for_level_564 = used_number_pieces_arr; break;
				case "level_565":
					used_number_pieces_arr_for_level_565 = used_number_pieces_arr; break;
				case "level_566":
					used_number_pieces_arr_for_level_566 = used_number_pieces_arr; break;
				case "level_567":
					used_number_pieces_arr_for_level_567 = used_number_pieces_arr; break;
				case "level_568":
					used_number_pieces_arr_for_level_568 = used_number_pieces_arr; break;
				case "level_569":
					used_number_pieces_arr_for_level_569 = used_number_pieces_arr; break;
				case "level_570":
					used_number_pieces_arr_for_level_570 = used_number_pieces_arr; break;
				case "level_571":
					used_number_pieces_arr_for_level_571 = used_number_pieces_arr; break;
				case "level_572":
					used_number_pieces_arr_for_level_572 = used_number_pieces_arr; break;
				case "level_573":
					used_number_pieces_arr_for_level_573 = used_number_pieces_arr; break;
				case "level_574":
					used_number_pieces_arr_for_level_574 = used_number_pieces_arr; break;
				case "level_575":
					used_number_pieces_arr_for_level_575 = used_number_pieces_arr; break;
				case "level_576":
					used_number_pieces_arr_for_level_576 = used_number_pieces_arr; break;
				case "level_577":
					used_number_pieces_arr_for_level_577 = used_number_pieces_arr; break;
				case "level_578":
					used_number_pieces_arr_for_level_578 = used_number_pieces_arr; break;
				case "level_579":
					used_number_pieces_arr_for_level_579 = used_number_pieces_arr; break;
				case "level_580":
					used_number_pieces_arr_for_level_580 = used_number_pieces_arr; break;
				case "level_581":
					used_number_pieces_arr_for_level_581 = used_number_pieces_arr; break;
				case "level_582":
					used_number_pieces_arr_for_level_582 = used_number_pieces_arr; break;
				case "level_583":
					used_number_pieces_arr_for_level_583 = used_number_pieces_arr; break;
				case "level_584":
					used_number_pieces_arr_for_level_584 = used_number_pieces_arr; break;
				case "level_585":
					used_number_pieces_arr_for_level_585 = used_number_pieces_arr; break;
				case "level_586":
					used_number_pieces_arr_for_level_586 = used_number_pieces_arr; break;
				case "level_587":
					used_number_pieces_arr_for_level_587 = used_number_pieces_arr; break;
				case "level_588":
					used_number_pieces_arr_for_level_588 = used_number_pieces_arr; break;
				case "level_589":
					used_number_pieces_arr_for_level_589 = used_number_pieces_arr; break;
				case "level_590":
					used_number_pieces_arr_for_level_590 = used_number_pieces_arr; break;
				case "level_591":
					used_number_pieces_arr_for_level_591 = used_number_pieces_arr; break;
				case "level_592":
					used_number_pieces_arr_for_level_592 = used_number_pieces_arr; break;
				case "level_593":
					used_number_pieces_arr_for_level_593 = used_number_pieces_arr; break;
				case "level_594":
					used_number_pieces_arr_for_level_594 = used_number_pieces_arr; break;
				case "level_595":
					used_number_pieces_arr_for_level_595 = used_number_pieces_arr; break;
				case "level_596":
					used_number_pieces_arr_for_level_596 = used_number_pieces_arr; break;
				case "level_597":
					used_number_pieces_arr_for_level_597 = used_number_pieces_arr; break;
				case "level_598":
					used_number_pieces_arr_for_level_598 = used_number_pieces_arr; break;
				case "level_599":
					used_number_pieces_arr_for_level_599 = used_number_pieces_arr; break;
				case "level_600":
					used_number_pieces_arr_for_level_600 = used_number_pieces_arr; break;
				case "level_601":
					used_number_pieces_arr_for_level_601 = used_number_pieces_arr; break;
				case "level_602":
					used_number_pieces_arr_for_level_602 = used_number_pieces_arr; break;
				case "level_603":
					used_number_pieces_arr_for_level_603 = used_number_pieces_arr; break;
				case "level_604":
					used_number_pieces_arr_for_level_604 = used_number_pieces_arr; break;
				case "level_605":
					used_number_pieces_arr_for_level_605 = used_number_pieces_arr; break;
				case "level_606":
					used_number_pieces_arr_for_level_606 = used_number_pieces_arr; break;
				case "level_607":
					used_number_pieces_arr_for_level_607 = used_number_pieces_arr; break;
				case "level_608":
					used_number_pieces_arr_for_level_608 = used_number_pieces_arr; break;
				case "level_609":
					used_number_pieces_arr_for_level_609 = used_number_pieces_arr; break;
				case "level_610":
					used_number_pieces_arr_for_level_610 = used_number_pieces_arr; break;
				case "level_611":
					used_number_pieces_arr_for_level_611 = used_number_pieces_arr; break;
				case "level_612":
					used_number_pieces_arr_for_level_612 = used_number_pieces_arr; break;
				case "level_613":
					used_number_pieces_arr_for_level_613 = used_number_pieces_arr; break;
				case "level_614":
					used_number_pieces_arr_for_level_614 = used_number_pieces_arr; break;
				case "level_615":
					used_number_pieces_arr_for_level_615 = used_number_pieces_arr; break;
				case "level_616":
					used_number_pieces_arr_for_level_616 = used_number_pieces_arr; break;
				case "level_617":
					used_number_pieces_arr_for_level_617 = used_number_pieces_arr; break;
				case "level_618":
					used_number_pieces_arr_for_level_618 = used_number_pieces_arr; break;
				case "level_619":
					used_number_pieces_arr_for_level_619 = used_number_pieces_arr; break;
				case "level_620":
					used_number_pieces_arr_for_level_620 = used_number_pieces_arr; break;
				case "level_621":
					used_number_pieces_arr_for_level_621 = used_number_pieces_arr; break;
				case "level_622":
					used_number_pieces_arr_for_level_622 = used_number_pieces_arr; break;
				case "level_623":
					used_number_pieces_arr_for_level_623 = used_number_pieces_arr; break;
				case "level_624":
					used_number_pieces_arr_for_level_624 = used_number_pieces_arr; break;
				case "level_625":
					used_number_pieces_arr_for_level_625 = used_number_pieces_arr; break;
				case "level_626":
					used_number_pieces_arr_for_level_626 = used_number_pieces_arr; break;
				case "level_627":
					used_number_pieces_arr_for_level_627 = used_number_pieces_arr; break;
				case "level_628":
					used_number_pieces_arr_for_level_628 = used_number_pieces_arr; break;
				case "level_629":
					used_number_pieces_arr_for_level_629 = used_number_pieces_arr; break;
				case "level_630":
					used_number_pieces_arr_for_level_630 = used_number_pieces_arr; break;
				case "level_631":
					used_number_pieces_arr_for_level_631 = used_number_pieces_arr; break;
				case "level_632":
					used_number_pieces_arr_for_level_632 = used_number_pieces_arr; break;
				case "level_633":
					used_number_pieces_arr_for_level_633 = used_number_pieces_arr; break;
				case "level_634":
					used_number_pieces_arr_for_level_634 = used_number_pieces_arr; break;
				case "level_635":
					used_number_pieces_arr_for_level_635 = used_number_pieces_arr; break;
				case "level_636":
					used_number_pieces_arr_for_level_636 = used_number_pieces_arr; break;
				case "level_637":
					used_number_pieces_arr_for_level_637 = used_number_pieces_arr; break;
				case "level_638":
					used_number_pieces_arr_for_level_638 = used_number_pieces_arr; break;
				case "level_639":
					used_number_pieces_arr_for_level_639 = used_number_pieces_arr; break;
				case "level_640":
					used_number_pieces_arr_for_level_640 = used_number_pieces_arr; break;
				case "level_641":
					used_number_pieces_arr_for_level_641 = used_number_pieces_arr; break;
				case "level_642":
					used_number_pieces_arr_for_level_642 = used_number_pieces_arr; break;
				case "level_643":
					used_number_pieces_arr_for_level_643 = used_number_pieces_arr; break;
				case "level_644":
					used_number_pieces_arr_for_level_644 = used_number_pieces_arr; break;
				case "level_645":
					used_number_pieces_arr_for_level_645 = used_number_pieces_arr; break;
				case "level_646":
					used_number_pieces_arr_for_level_646 = used_number_pieces_arr; break;
				case "level_647":
					used_number_pieces_arr_for_level_647 = used_number_pieces_arr; break;
				case "level_648":
					used_number_pieces_arr_for_level_648 = used_number_pieces_arr; break;
				case "level_649":
					used_number_pieces_arr_for_level_649 = used_number_pieces_arr; break;
				case "level_650":
					used_number_pieces_arr_for_level_650 = used_number_pieces_arr; break;
				case "level_651":
					used_number_pieces_arr_for_level_651 = used_number_pieces_arr; break;
				case "level_652":
					used_number_pieces_arr_for_level_652 = used_number_pieces_arr; break;
				case "level_653":
					used_number_pieces_arr_for_level_653 = used_number_pieces_arr; break;
				case "level_654":
					used_number_pieces_arr_for_level_654 = used_number_pieces_arr; break;
				case "level_655":
					used_number_pieces_arr_for_level_655 = used_number_pieces_arr; break;
				case "level_656":
					used_number_pieces_arr_for_level_656 = used_number_pieces_arr; break;
				case "level_657":
					used_number_pieces_arr_for_level_657 = used_number_pieces_arr; break;
				case "level_658":
					used_number_pieces_arr_for_level_658 = used_number_pieces_arr; break;
				case "level_659":
					used_number_pieces_arr_for_level_659 = used_number_pieces_arr; break;
				case "level_660":
					used_number_pieces_arr_for_level_660 = used_number_pieces_arr; break;
				case "level_661":
					used_number_pieces_arr_for_level_661 = used_number_pieces_arr; break;
				case "level_662":
					used_number_pieces_arr_for_level_662 = used_number_pieces_arr; break;
				case "level_663":
					used_number_pieces_arr_for_level_663 = used_number_pieces_arr; break;
				case "level_664":
					used_number_pieces_arr_for_level_664 = used_number_pieces_arr; break;
				case "level_665":
					used_number_pieces_arr_for_level_665 = used_number_pieces_arr; break;
				case "level_666":
					used_number_pieces_arr_for_level_666 = used_number_pieces_arr; break;
				case "level_667":
					used_number_pieces_arr_for_level_667 = used_number_pieces_arr; break;
				case "level_668":
					used_number_pieces_arr_for_level_668 = used_number_pieces_arr; break;
				case "level_669":
					used_number_pieces_arr_for_level_669 = used_number_pieces_arr; break;
				case "level_670":
					used_number_pieces_arr_for_level_670 = used_number_pieces_arr; break;
				case "level_671":
					used_number_pieces_arr_for_level_671 = used_number_pieces_arr; break;
				case "level_672":
					used_number_pieces_arr_for_level_672 = used_number_pieces_arr; break;
				case "level_673":
					used_number_pieces_arr_for_level_673 = used_number_pieces_arr; break;
				case "level_674":
					used_number_pieces_arr_for_level_674 = used_number_pieces_arr; break;
				case "level_675":
					used_number_pieces_arr_for_level_675 = used_number_pieces_arr; break;
				case "level_676":
					used_number_pieces_arr_for_level_676 = used_number_pieces_arr; break;
				case "level_677":
					used_number_pieces_arr_for_level_677 = used_number_pieces_arr; break;
				case "level_678":
					used_number_pieces_arr_for_level_678 = used_number_pieces_arr; break;
				case "level_679":
					used_number_pieces_arr_for_level_679 = used_number_pieces_arr; break;
				case "level_680":
					used_number_pieces_arr_for_level_680 = used_number_pieces_arr; break;
				case "level_681":
					used_number_pieces_arr_for_level_681 = used_number_pieces_arr; break;
				case "level_682":
					used_number_pieces_arr_for_level_682 = used_number_pieces_arr; break;
				case "level_683":
					used_number_pieces_arr_for_level_683 = used_number_pieces_arr; break;
				case "level_684":
					used_number_pieces_arr_for_level_684 = used_number_pieces_arr; break;
				case "level_685":
					used_number_pieces_arr_for_level_685 = used_number_pieces_arr; break;
				case "level_686":
					used_number_pieces_arr_for_level_686 = used_number_pieces_arr; break;
				case "level_687":
					used_number_pieces_arr_for_level_687 = used_number_pieces_arr; break;
				case "level_688":
					used_number_pieces_arr_for_level_688 = used_number_pieces_arr; break;
				case "level_689":
					used_number_pieces_arr_for_level_689 = used_number_pieces_arr; break;
				case "level_690":
					used_number_pieces_arr_for_level_690 = used_number_pieces_arr; break;
				case "level_691":
					used_number_pieces_arr_for_level_691 = used_number_pieces_arr; break;
				case "level_692":
					used_number_pieces_arr_for_level_692 = used_number_pieces_arr; break;
				case "level_693":
					used_number_pieces_arr_for_level_693 = used_number_pieces_arr; break;
				case "level_694":
					used_number_pieces_arr_for_level_694 = used_number_pieces_arr; break;
				case "level_695":
					used_number_pieces_arr_for_level_695 = used_number_pieces_arr; break;
				case "level_696":
					used_number_pieces_arr_for_level_696 = used_number_pieces_arr; break;
				case "level_697":
					used_number_pieces_arr_for_level_697 = used_number_pieces_arr; break;
				case "level_698":
					used_number_pieces_arr_for_level_698 = used_number_pieces_arr; break;
				case "level_699":
					used_number_pieces_arr_for_level_699 = used_number_pieces_arr; break;
				case "level_700":
					used_number_pieces_arr_for_level_700 = used_number_pieces_arr; break;
				case "level_701":
					used_number_pieces_arr_for_level_701 = used_number_pieces_arr; break;
				case "level_702":
					used_number_pieces_arr_for_level_702 = used_number_pieces_arr; break;
				case "level_703":
					used_number_pieces_arr_for_level_703 = used_number_pieces_arr; break;
				case "level_704":
					used_number_pieces_arr_for_level_704 = used_number_pieces_arr; break;
				case "level_705":
					used_number_pieces_arr_for_level_705 = used_number_pieces_arr; break;
				case "level_706":
					used_number_pieces_arr_for_level_706 = used_number_pieces_arr; break;
				case "level_707":
					used_number_pieces_arr_for_level_707 = used_number_pieces_arr; break;
				case "level_708":
					used_number_pieces_arr_for_level_708 = used_number_pieces_arr; break;
				case "level_709":
					used_number_pieces_arr_for_level_709 = used_number_pieces_arr; break;
				case "level_710":
					used_number_pieces_arr_for_level_710 = used_number_pieces_arr; break;
				case "level_711":
					used_number_pieces_arr_for_level_711 = used_number_pieces_arr; break;
				case "level_712":
					used_number_pieces_arr_for_level_712 = used_number_pieces_arr; break;
				case "level_713":
					used_number_pieces_arr_for_level_713 = used_number_pieces_arr; break;
				case "level_714":
					used_number_pieces_arr_for_level_714 = used_number_pieces_arr; break;
				case "level_715":
					used_number_pieces_arr_for_level_715 = used_number_pieces_arr; break;
				case "level_716":
					used_number_pieces_arr_for_level_716 = used_number_pieces_arr; break;
				case "level_717":
					used_number_pieces_arr_for_level_717 = used_number_pieces_arr; break;
				case "level_718":
					used_number_pieces_arr_for_level_718 = used_number_pieces_arr; break;
				case "level_719":
					used_number_pieces_arr_for_level_719 = used_number_pieces_arr; break;
				case "level_720":
					used_number_pieces_arr_for_level_720 = used_number_pieces_arr; break;
				case "level_721":
					used_number_pieces_arr_for_level_721 = used_number_pieces_arr; break;
				case "level_722":
					used_number_pieces_arr_for_level_722 = used_number_pieces_arr; break;
				case "level_723":
					used_number_pieces_arr_for_level_723 = used_number_pieces_arr; break;
				case "level_724":
					used_number_pieces_arr_for_level_724 = used_number_pieces_arr; break;
				case "level_725":
					used_number_pieces_arr_for_level_725 = used_number_pieces_arr; break;
				case "level_726":
					used_number_pieces_arr_for_level_726 = used_number_pieces_arr; break;
				case "level_727":
					used_number_pieces_arr_for_level_727 = used_number_pieces_arr; break;
				case "level_728":
					used_number_pieces_arr_for_level_728 = used_number_pieces_arr; break;
				case "level_729":
					used_number_pieces_arr_for_level_729 = used_number_pieces_arr; break;
				case "level_730":
					used_number_pieces_arr_for_level_730 = used_number_pieces_arr; break;
				case "level_731":
					used_number_pieces_arr_for_level_731 = used_number_pieces_arr; break;
				case "level_732":
					used_number_pieces_arr_for_level_732 = used_number_pieces_arr; break;
				case "level_733":
					used_number_pieces_arr_for_level_733 = used_number_pieces_arr; break;
				case "level_734":
					used_number_pieces_arr_for_level_734 = used_number_pieces_arr; break;
				case "level_735":
					used_number_pieces_arr_for_level_735 = used_number_pieces_arr; break;
				case "level_736":
					used_number_pieces_arr_for_level_736 = used_number_pieces_arr; break;
				case "level_737":
					used_number_pieces_arr_for_level_737 = used_number_pieces_arr; break;
				case "level_738":
					used_number_pieces_arr_for_level_738 = used_number_pieces_arr; break;
				case "level_739":
					used_number_pieces_arr_for_level_739 = used_number_pieces_arr; break;
				case "level_740":
					used_number_pieces_arr_for_level_740 = used_number_pieces_arr; break;
				case "level_741":
					used_number_pieces_arr_for_level_741 = used_number_pieces_arr; break;
				case "level_742":
					used_number_pieces_arr_for_level_742 = used_number_pieces_arr; break;
				case "level_743":
					used_number_pieces_arr_for_level_743 = used_number_pieces_arr; break;
				case "level_744":
					used_number_pieces_arr_for_level_744 = used_number_pieces_arr; break;
				case "level_745":
					used_number_pieces_arr_for_level_745 = used_number_pieces_arr; break;
				case "level_746":
					used_number_pieces_arr_for_level_746 = used_number_pieces_arr; break;
				case "level_747":
					used_number_pieces_arr_for_level_747 = used_number_pieces_arr; break;
				case "level_748":
					used_number_pieces_arr_for_level_748 = used_number_pieces_arr; break;
				case "level_749":
					used_number_pieces_arr_for_level_749 = used_number_pieces_arr; break;
				case "level_750":
					used_number_pieces_arr_for_level_750 = used_number_pieces_arr; break;
				case "level_751":
					used_number_pieces_arr_for_level_751 = used_number_pieces_arr; break;
				case "level_752":
					used_number_pieces_arr_for_level_752 = used_number_pieces_arr; break;
				case "level_753":
					used_number_pieces_arr_for_level_753 = used_number_pieces_arr; break;
				case "level_754":
					used_number_pieces_arr_for_level_754 = used_number_pieces_arr; break;
				case "level_755":
					used_number_pieces_arr_for_level_755 = used_number_pieces_arr; break;
				case "level_756":
					used_number_pieces_arr_for_level_756 = used_number_pieces_arr; break;
				case "level_757":
					used_number_pieces_arr_for_level_757 = used_number_pieces_arr; break;
				case "level_758":
					used_number_pieces_arr_for_level_758 = used_number_pieces_arr; break;
				case "level_759":
					used_number_pieces_arr_for_level_759 = used_number_pieces_arr; break;
				case "level_760":
					used_number_pieces_arr_for_level_760 = used_number_pieces_arr; break;
				case "level_761":
					used_number_pieces_arr_for_level_761 = used_number_pieces_arr; break;
				case "level_762":
					used_number_pieces_arr_for_level_762 = used_number_pieces_arr; break;
				case "level_763":
					used_number_pieces_arr_for_level_763 = used_number_pieces_arr; break;
				case "level_764":
					used_number_pieces_arr_for_level_764 = used_number_pieces_arr; break;
				case "level_765":
					used_number_pieces_arr_for_level_765 = used_number_pieces_arr; break;
				case "level_766":
					used_number_pieces_arr_for_level_766 = used_number_pieces_arr; break;
				case "level_767":
					used_number_pieces_arr_for_level_767 = used_number_pieces_arr; break;
				case "level_768":
					used_number_pieces_arr_for_level_768 = used_number_pieces_arr; break;
				case "level_769":
					used_number_pieces_arr_for_level_769 = used_number_pieces_arr; break;
				case "level_770":
					used_number_pieces_arr_for_level_770 = used_number_pieces_arr; break;
				case "level_771":
					used_number_pieces_arr_for_level_771 = used_number_pieces_arr; break;
				case "level_772":
					used_number_pieces_arr_for_level_772 = used_number_pieces_arr; break;
				case "level_773":
					used_number_pieces_arr_for_level_773 = used_number_pieces_arr; break;
				case "level_774":
					used_number_pieces_arr_for_level_774 = used_number_pieces_arr; break;
				case "level_775":
					used_number_pieces_arr_for_level_775 = used_number_pieces_arr; break;
				case "level_776":
					used_number_pieces_arr_for_level_776 = used_number_pieces_arr; break;
				case "level_777":
					used_number_pieces_arr_for_level_777 = used_number_pieces_arr; break;
				case "level_778":
					used_number_pieces_arr_for_level_778 = used_number_pieces_arr; break;
				case "level_779":
					used_number_pieces_arr_for_level_779 = used_number_pieces_arr; break;
				case "level_780":
					used_number_pieces_arr_for_level_780 = used_number_pieces_arr; break;
				case "level_781":
					used_number_pieces_arr_for_level_781 = used_number_pieces_arr; break;
				case "level_782":
					used_number_pieces_arr_for_level_782 = used_number_pieces_arr; break;
				case "level_783":
					used_number_pieces_arr_for_level_783 = used_number_pieces_arr; break;
				case "level_784":
					used_number_pieces_arr_for_level_784 = used_number_pieces_arr; break;
				case "level_785":
					used_number_pieces_arr_for_level_785 = used_number_pieces_arr; break;
				case "level_786":
					used_number_pieces_arr_for_level_786 = used_number_pieces_arr; break;
				case "level_787":
					used_number_pieces_arr_for_level_787 = used_number_pieces_arr; break;
				case "level_788":
					used_number_pieces_arr_for_level_788 = used_number_pieces_arr; break;
				case "level_789":
					used_number_pieces_arr_for_level_789 = used_number_pieces_arr; break;
				case "level_790":
					used_number_pieces_arr_for_level_790 = used_number_pieces_arr; break;
				case "level_791":
					used_number_pieces_arr_for_level_791 = used_number_pieces_arr; break;
				case "level_792":
					used_number_pieces_arr_for_level_792 = used_number_pieces_arr; break;
				case "level_793":
					used_number_pieces_arr_for_level_793 = used_number_pieces_arr; break;
				case "level_794":
					used_number_pieces_arr_for_level_794 = used_number_pieces_arr; break;
				case "level_795":
					used_number_pieces_arr_for_level_795 = used_number_pieces_arr; break;
				case "level_796":
					used_number_pieces_arr_for_level_796 = used_number_pieces_arr; break;
				case "level_797":
					used_number_pieces_arr_for_level_797 = used_number_pieces_arr; break;
				case "level_798":
					used_number_pieces_arr_for_level_798 = used_number_pieces_arr; break;
				case "level_799":
					used_number_pieces_arr_for_level_799 = used_number_pieces_arr; break;
				case "level_800":
					used_number_pieces_arr_for_level_800 = used_number_pieces_arr; break;
				case "level_801":
					used_number_pieces_arr_for_level_801 = used_number_pieces_arr; break;
				case "level_802":
					used_number_pieces_arr_for_level_802 = used_number_pieces_arr; break;
				case "level_803":
					used_number_pieces_arr_for_level_803 = used_number_pieces_arr; break;
				case "level_804":
					used_number_pieces_arr_for_level_804 = used_number_pieces_arr; break;
				case "level_805":
					used_number_pieces_arr_for_level_805 = used_number_pieces_arr; break;
				case "level_806":
					used_number_pieces_arr_for_level_806 = used_number_pieces_arr; break;
				case "level_807":
					used_number_pieces_arr_for_level_807 = used_number_pieces_arr; break;
				case "level_808":
					used_number_pieces_arr_for_level_808 = used_number_pieces_arr; break;
				case "level_809":
					used_number_pieces_arr_for_level_809 = used_number_pieces_arr; break;
				case "level_810":
					used_number_pieces_arr_for_level_810 = used_number_pieces_arr; break;
				case "level_811":
					used_number_pieces_arr_for_level_811 = used_number_pieces_arr; break;
				case "level_812":
					used_number_pieces_arr_for_level_812 = used_number_pieces_arr; break;
				case "level_813":
					used_number_pieces_arr_for_level_813 = used_number_pieces_arr; break;
				case "level_814":
					used_number_pieces_arr_for_level_814 = used_number_pieces_arr; break;
				case "level_815":
					used_number_pieces_arr_for_level_815 = used_number_pieces_arr; break;
				case "level_816":
					used_number_pieces_arr_for_level_816 = used_number_pieces_arr; break;
				case "level_817":
					used_number_pieces_arr_for_level_817 = used_number_pieces_arr; break;
				case "level_818":
					used_number_pieces_arr_for_level_818 = used_number_pieces_arr; break;
				case "level_819":
					used_number_pieces_arr_for_level_819 = used_number_pieces_arr; break;
				case "level_820":
					used_number_pieces_arr_for_level_820 = used_number_pieces_arr; break;
				case "level_821":
					used_number_pieces_arr_for_level_821 = used_number_pieces_arr; break;
				case "level_822":
					used_number_pieces_arr_for_level_822 = used_number_pieces_arr; break;
				case "level_823":
					used_number_pieces_arr_for_level_823 = used_number_pieces_arr; break;
				case "level_824":
					used_number_pieces_arr_for_level_824 = used_number_pieces_arr; break;
				case "level_825":
					used_number_pieces_arr_for_level_825 = used_number_pieces_arr; break;
				case "level_826":
					used_number_pieces_arr_for_level_826 = used_number_pieces_arr; break;
				case "level_827":
					used_number_pieces_arr_for_level_827 = used_number_pieces_arr; break;
				case "level_828":
					used_number_pieces_arr_for_level_828 = used_number_pieces_arr; break;
				case "level_829":
					used_number_pieces_arr_for_level_829 = used_number_pieces_arr; break;
				case "level_830":
					used_number_pieces_arr_for_level_830 = used_number_pieces_arr; break;
				case "level_831":
					used_number_pieces_arr_for_level_831 = used_number_pieces_arr; break;
				case "level_832":
					used_number_pieces_arr_for_level_832 = used_number_pieces_arr; break;
				case "level_833":
					used_number_pieces_arr_for_level_833 = used_number_pieces_arr; break;
				case "level_834":
					used_number_pieces_arr_for_level_834 = used_number_pieces_arr; break;
				case "level_835":
					used_number_pieces_arr_for_level_835 = used_number_pieces_arr; break;
				case "level_836":
					used_number_pieces_arr_for_level_836 = used_number_pieces_arr; break;
				case "level_837":
					used_number_pieces_arr_for_level_837 = used_number_pieces_arr; break;
				case "level_838":
					used_number_pieces_arr_for_level_838 = used_number_pieces_arr; break;
				case "level_839":
					used_number_pieces_arr_for_level_839 = used_number_pieces_arr; break;
				case "level_840":
					used_number_pieces_arr_for_level_840 = used_number_pieces_arr; break;
				case "level_841":
					used_number_pieces_arr_for_level_841 = used_number_pieces_arr; break;
				case "level_842":
					used_number_pieces_arr_for_level_842 = used_number_pieces_arr; break;
				case "level_843":
					used_number_pieces_arr_for_level_843 = used_number_pieces_arr; break;
				case "level_844":
					used_number_pieces_arr_for_level_844 = used_number_pieces_arr; break;
				case "level_845":
					used_number_pieces_arr_for_level_845 = used_number_pieces_arr; break;
				case "level_846":
					used_number_pieces_arr_for_level_846 = used_number_pieces_arr; break;
				case "level_847":
					used_number_pieces_arr_for_level_847 = used_number_pieces_arr; break;
				case "level_848":
					used_number_pieces_arr_for_level_848 = used_number_pieces_arr; break;
				case "level_849":
					used_number_pieces_arr_for_level_849 = used_number_pieces_arr; break;
				case "level_850":
					used_number_pieces_arr_for_level_850 = used_number_pieces_arr; break;
				case "level_851":
					used_number_pieces_arr_for_level_851 = used_number_pieces_arr; break;
				case "level_852":
					used_number_pieces_arr_for_level_852 = used_number_pieces_arr; break;
				case "level_853":
					used_number_pieces_arr_for_level_853 = used_number_pieces_arr; break;
				case "level_854":
					used_number_pieces_arr_for_level_854 = used_number_pieces_arr; break;
				case "level_855":
					used_number_pieces_arr_for_level_855 = used_number_pieces_arr; break;
				case "level_856":
					used_number_pieces_arr_for_level_856 = used_number_pieces_arr; break;
				case "level_857":
					used_number_pieces_arr_for_level_857 = used_number_pieces_arr; break;
				case "level_858":
					used_number_pieces_arr_for_level_858 = used_number_pieces_arr; break;
				case "level_859":
					used_number_pieces_arr_for_level_859 = used_number_pieces_arr; break;
				case "level_860":
					used_number_pieces_arr_for_level_860 = used_number_pieces_arr; break;
				case "level_861":
					used_number_pieces_arr_for_level_861 = used_number_pieces_arr; break;
				case "level_862":
					used_number_pieces_arr_for_level_862 = used_number_pieces_arr; break;
				case "level_863":
					used_number_pieces_arr_for_level_863 = used_number_pieces_arr; break;
				case "level_864":
					used_number_pieces_arr_for_level_864 = used_number_pieces_arr; break;
				case "level_865":
					used_number_pieces_arr_for_level_865 = used_number_pieces_arr; break;
				case "level_866":
					used_number_pieces_arr_for_level_866 = used_number_pieces_arr; break;
				case "level_867":
					used_number_pieces_arr_for_level_867 = used_number_pieces_arr; break;
				case "level_868":
					used_number_pieces_arr_for_level_868 = used_number_pieces_arr; break;
				case "level_869":
					used_number_pieces_arr_for_level_869 = used_number_pieces_arr; break;
				case "level_870":
					used_number_pieces_arr_for_level_870 = used_number_pieces_arr; break;
				case "level_871":
					used_number_pieces_arr_for_level_871 = used_number_pieces_arr; break;
				case "level_872":
					used_number_pieces_arr_for_level_872 = used_number_pieces_arr; break;
				case "level_873":
					used_number_pieces_arr_for_level_873 = used_number_pieces_arr; break;
				case "level_874":
					used_number_pieces_arr_for_level_874 = used_number_pieces_arr; break;
				case "level_875":
					used_number_pieces_arr_for_level_875 = used_number_pieces_arr; break;
				case "level_876":
					used_number_pieces_arr_for_level_876 = used_number_pieces_arr; break;
				case "level_877":
					used_number_pieces_arr_for_level_877 = used_number_pieces_arr; break;
				case "level_878":
					used_number_pieces_arr_for_level_878 = used_number_pieces_arr; break;
				case "level_879":
					used_number_pieces_arr_for_level_879 = used_number_pieces_arr; break;
				case "level_880":
					used_number_pieces_arr_for_level_880 = used_number_pieces_arr; break;
				case "level_881":
					used_number_pieces_arr_for_level_881 = used_number_pieces_arr; break;
				case "level_882":
					used_number_pieces_arr_for_level_882 = used_number_pieces_arr; break;
				case "level_883":
					used_number_pieces_arr_for_level_883 = used_number_pieces_arr; break;
				case "level_884":
					used_number_pieces_arr_for_level_884 = used_number_pieces_arr; break;
				case "level_885":
					used_number_pieces_arr_for_level_885 = used_number_pieces_arr; break;
				case "level_886":
					used_number_pieces_arr_for_level_886 = used_number_pieces_arr; break;
				case "level_887":
					used_number_pieces_arr_for_level_887 = used_number_pieces_arr; break;
				case "level_888":
					used_number_pieces_arr_for_level_888 = used_number_pieces_arr; break;
				case "level_889":
					used_number_pieces_arr_for_level_889 = used_number_pieces_arr; break;
				case "level_890":
					used_number_pieces_arr_for_level_890 = used_number_pieces_arr; break;
				case "level_891":
					used_number_pieces_arr_for_level_891 = used_number_pieces_arr; break;
				case "level_892":
					used_number_pieces_arr_for_level_892 = used_number_pieces_arr; break;
				case "level_893":
					used_number_pieces_arr_for_level_893 = used_number_pieces_arr; break;
				case "level_894":
					used_number_pieces_arr_for_level_894 = used_number_pieces_arr; break;
				case "level_895":
					used_number_pieces_arr_for_level_895 = used_number_pieces_arr; break;
				case "level_896":
					used_number_pieces_arr_for_level_896 = used_number_pieces_arr; break;
				case "level_897":
					used_number_pieces_arr_for_level_897 = used_number_pieces_arr; break;
				case "level_898":
					used_number_pieces_arr_for_level_898 = used_number_pieces_arr; break;
				case "level_899":
					used_number_pieces_arr_for_level_899 = used_number_pieces_arr; break;
				case "level_900":
					used_number_pieces_arr_for_level_900 = used_number_pieces_arr; break;
				case "level_901":
					used_number_pieces_arr_for_level_901 = used_number_pieces_arr; break;
				case "level_902":
					used_number_pieces_arr_for_level_902 = used_number_pieces_arr; break;
				case "level_903":
					used_number_pieces_arr_for_level_903 = used_number_pieces_arr; break;
				case "level_904":
					used_number_pieces_arr_for_level_904 = used_number_pieces_arr; break;
				case "level_905":
					used_number_pieces_arr_for_level_905 = used_number_pieces_arr; break;
				case "level_906":
					used_number_pieces_arr_for_level_906 = used_number_pieces_arr; break;
				case "level_907":
					used_number_pieces_arr_for_level_907 = used_number_pieces_arr; break;
				case "level_908":
					used_number_pieces_arr_for_level_908 = used_number_pieces_arr; break;
				case "level_909":
					used_number_pieces_arr_for_level_909 = used_number_pieces_arr; break;
				case "level_910":
					used_number_pieces_arr_for_level_910 = used_number_pieces_arr; break;
				case "level_911":
					used_number_pieces_arr_for_level_911 = used_number_pieces_arr; break;
				case "level_912":
					used_number_pieces_arr_for_level_912 = used_number_pieces_arr; break;
				case "level_913":
					used_number_pieces_arr_for_level_913 = used_number_pieces_arr; break;
				case "level_914":
					used_number_pieces_arr_for_level_914 = used_number_pieces_arr; break;
				case "level_915":
					used_number_pieces_arr_for_level_915 = used_number_pieces_arr; break;
				case "level_916":
					used_number_pieces_arr_for_level_916 = used_number_pieces_arr; break;
				case "level_917":
					used_number_pieces_arr_for_level_917 = used_number_pieces_arr; break;
				case "level_918":
					used_number_pieces_arr_for_level_918 = used_number_pieces_arr; break;
				case "level_919":
					used_number_pieces_arr_for_level_919 = used_number_pieces_arr; break;
				case "level_920":
					used_number_pieces_arr_for_level_920 = used_number_pieces_arr; break;
				case "level_921":
					used_number_pieces_arr_for_level_921 = used_number_pieces_arr; break;
				case "level_922":
					used_number_pieces_arr_for_level_922 = used_number_pieces_arr; break;
				case "level_923":
					used_number_pieces_arr_for_level_923 = used_number_pieces_arr; break;
				case "level_924":
					used_number_pieces_arr_for_level_924 = used_number_pieces_arr; break;
				case "level_925":
					used_number_pieces_arr_for_level_925 = used_number_pieces_arr; break;
				case "level_926":
					used_number_pieces_arr_for_level_926 = used_number_pieces_arr; break;
				case "level_927":
					used_number_pieces_arr_for_level_927 = used_number_pieces_arr; break;
				case "level_928":
					used_number_pieces_arr_for_level_928 = used_number_pieces_arr; break;
				case "level_929":
					used_number_pieces_arr_for_level_929 = used_number_pieces_arr; break;
				case "level_930":
					used_number_pieces_arr_for_level_930 = used_number_pieces_arr; break;
				case "level_931":
					used_number_pieces_arr_for_level_931 = used_number_pieces_arr; break;
				case "level_932":
					used_number_pieces_arr_for_level_932 = used_number_pieces_arr; break;
				case "level_933":
					used_number_pieces_arr_for_level_933 = used_number_pieces_arr; break;
				case "level_934":
					used_number_pieces_arr_for_level_934 = used_number_pieces_arr; break;
				case "level_935":
					used_number_pieces_arr_for_level_935 = used_number_pieces_arr; break;
				case "level_936":
					used_number_pieces_arr_for_level_936 = used_number_pieces_arr; break;
				case "level_937":
					used_number_pieces_arr_for_level_937 = used_number_pieces_arr; break;
				case "level_938":
					used_number_pieces_arr_for_level_938 = used_number_pieces_arr; break;
				case "level_939":
					used_number_pieces_arr_for_level_939 = used_number_pieces_arr; break;
				case "level_940":
					used_number_pieces_arr_for_level_940 = used_number_pieces_arr; break;
				case "level_941":
					used_number_pieces_arr_for_level_941 = used_number_pieces_arr; break;
				case "level_942":
					used_number_pieces_arr_for_level_942 = used_number_pieces_arr; break;
				case "level_943":
					used_number_pieces_arr_for_level_943 = used_number_pieces_arr; break;
				case "level_944":
					used_number_pieces_arr_for_level_944 = used_number_pieces_arr; break;
				case "level_945":
					used_number_pieces_arr_for_level_945 = used_number_pieces_arr; break;
				case "level_946":
					used_number_pieces_arr_for_level_946 = used_number_pieces_arr; break;
				case "level_947":
					used_number_pieces_arr_for_level_947 = used_number_pieces_arr; break;
				case "level_948":
					used_number_pieces_arr_for_level_948 = used_number_pieces_arr; break;
				case "level_949":
					used_number_pieces_arr_for_level_949 = used_number_pieces_arr; break;
				case "level_950":
					used_number_pieces_arr_for_level_950 = used_number_pieces_arr; break;
				case "level_951":
					used_number_pieces_arr_for_level_951 = used_number_pieces_arr; break;
				case "level_952":
					used_number_pieces_arr_for_level_952 = used_number_pieces_arr; break;
				case "level_953":
					used_number_pieces_arr_for_level_953 = used_number_pieces_arr; break;
				case "level_954":
					used_number_pieces_arr_for_level_954 = used_number_pieces_arr; break;
				case "level_955":
					used_number_pieces_arr_for_level_955 = used_number_pieces_arr; break;
				case "level_956":
					used_number_pieces_arr_for_level_956 = used_number_pieces_arr; break;
				case "level_957":
					used_number_pieces_arr_for_level_957 = used_number_pieces_arr; break;
				case "level_958":
					used_number_pieces_arr_for_level_958 = used_number_pieces_arr; break;
				case "level_959":
					used_number_pieces_arr_for_level_959 = used_number_pieces_arr; break;
				case "level_960":
					used_number_pieces_arr_for_level_960 = used_number_pieces_arr; break;
				case "level_961":
					used_number_pieces_arr_for_level_961 = used_number_pieces_arr; break;
				case "level_962":
					used_number_pieces_arr_for_level_962 = used_number_pieces_arr; break;
				case "level_963":
					used_number_pieces_arr_for_level_963 = used_number_pieces_arr; break;
				case "level_964":
					used_number_pieces_arr_for_level_964 = used_number_pieces_arr; break;
				case "level_965":
					used_number_pieces_arr_for_level_965 = used_number_pieces_arr; break;
				case "level_966":
					used_number_pieces_arr_for_level_966 = used_number_pieces_arr; break;
				case "level_967":
					used_number_pieces_arr_for_level_967 = used_number_pieces_arr; break;
				case "level_968":
					used_number_pieces_arr_for_level_968 = used_number_pieces_arr; break;
				case "level_969":
					used_number_pieces_arr_for_level_969 = used_number_pieces_arr; break;
				case "level_970":
					used_number_pieces_arr_for_level_970 = used_number_pieces_arr; break;
				case "level_971":
					used_number_pieces_arr_for_level_971 = used_number_pieces_arr; break;
				case "level_972":
					used_number_pieces_arr_for_level_972 = used_number_pieces_arr; break;
				case "level_973":
					used_number_pieces_arr_for_level_973 = used_number_pieces_arr; break;
				case "level_974":
					used_number_pieces_arr_for_level_974 = used_number_pieces_arr; break;
				case "level_975":
					used_number_pieces_arr_for_level_975 = used_number_pieces_arr; break;
				case "level_976":
					used_number_pieces_arr_for_level_976 = used_number_pieces_arr; break;
				case "level_977":
					used_number_pieces_arr_for_level_977 = used_number_pieces_arr; break;
				case "level_978":
					used_number_pieces_arr_for_level_978 = used_number_pieces_arr; break;
				case "level_979":
					used_number_pieces_arr_for_level_979 = used_number_pieces_arr; break;
				case "level_980":
					used_number_pieces_arr_for_level_980 = used_number_pieces_arr; break;
				case "level_981":
					used_number_pieces_arr_for_level_981 = used_number_pieces_arr; break;
				case "level_982":
					used_number_pieces_arr_for_level_982 = used_number_pieces_arr; break;
				case "level_983":
					used_number_pieces_arr_for_level_983 = used_number_pieces_arr; break;
				case "level_984":
					used_number_pieces_arr_for_level_984 = used_number_pieces_arr; break;
				case "level_985":
					used_number_pieces_arr_for_level_985 = used_number_pieces_arr; break;
				case "level_986":
					used_number_pieces_arr_for_level_986 = used_number_pieces_arr; break;
				case "level_987":
					used_number_pieces_arr_for_level_987 = used_number_pieces_arr; break;
				case "level_988":
					used_number_pieces_arr_for_level_988 = used_number_pieces_arr; break;
				case "level_989":
					used_number_pieces_arr_for_level_989 = used_number_pieces_arr; break;
				case "level_990":
					used_number_pieces_arr_for_level_990 = used_number_pieces_arr; break;
				case "level_991":
					used_number_pieces_arr_for_level_991 = used_number_pieces_arr; break;
				case "level_992":
					used_number_pieces_arr_for_level_992 = used_number_pieces_arr; break;
				case "level_993":
					used_number_pieces_arr_for_level_993 = used_number_pieces_arr; break;
				case "level_994":
					used_number_pieces_arr_for_level_994 = used_number_pieces_arr; break;
				case "level_995":
					used_number_pieces_arr_for_level_995 = used_number_pieces_arr; break;
				case "level_996":
					used_number_pieces_arr_for_level_996 = used_number_pieces_arr; break;
				case "level_997":
					used_number_pieces_arr_for_level_997 = used_number_pieces_arr; break;
				case "level_998":
					used_number_pieces_arr_for_level_998 = used_number_pieces_arr; break;
				case "level_999":
					used_number_pieces_arr_for_level_999 = used_number_pieces_arr; break;
				case "level_1000":
					used_number_pieces_arr_for_level_1000 = used_number_pieces_arr; break;
				default:
					break;
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
				case "level_31":
					return used_number_pieces_arr_for_level_31;
				case "level_32":
					return used_number_pieces_arr_for_level_32;
				case "level_33":
					return used_number_pieces_arr_for_level_33;
				case "level_34":
					return used_number_pieces_arr_for_level_34;
				case "level_35":
					return used_number_pieces_arr_for_level_35;
				case "level_36":
					return used_number_pieces_arr_for_level_36;
				case "level_37":
					return used_number_pieces_arr_for_level_37;
				case "level_38":
					return used_number_pieces_arr_for_level_38;
				case "level_39":
					return used_number_pieces_arr_for_level_39;
				case "level_40":
					return used_number_pieces_arr_for_level_40;
				case "level_41":
					return used_number_pieces_arr_for_level_41;
				case "level_42":
					return used_number_pieces_arr_for_level_42;
				case "level_43":
					return used_number_pieces_arr_for_level_43;
				case "level_44":
					return used_number_pieces_arr_for_level_44;
				case "level_45":
					return used_number_pieces_arr_for_level_45;
				case "level_46":
					return used_number_pieces_arr_for_level_46;
				case "level_47":
					return used_number_pieces_arr_for_level_47;
				case "level_48":
					return used_number_pieces_arr_for_level_48;
				case "level_49":
					return used_number_pieces_arr_for_level_49;
				case "level_50":
					return used_number_pieces_arr_for_level_50;
				case "level_51":
					return used_number_pieces_arr_for_level_51;
				case "level_52":
					return used_number_pieces_arr_for_level_52;
				case "level_53":
					return used_number_pieces_arr_for_level_53;
				case "level_54":
					return used_number_pieces_arr_for_level_54;
				case "level_55":
					return used_number_pieces_arr_for_level_55;
				case "level_56":
					return used_number_pieces_arr_for_level_56;
				case "level_57":
					return used_number_pieces_arr_for_level_57;
				case "level_58":
					return used_number_pieces_arr_for_level_58;
				case "level_59":
					return used_number_pieces_arr_for_level_59;
				case "level_60":
					return used_number_pieces_arr_for_level_60;
				case "level_61":
					return used_number_pieces_arr_for_level_61;
				case "level_62":
					return used_number_pieces_arr_for_level_62;
				case "level_63":
					return used_number_pieces_arr_for_level_63;
				case "level_64":
					return used_number_pieces_arr_for_level_64;
				case "level_65":
					return used_number_pieces_arr_for_level_65;
				case "level_66":
					return used_number_pieces_arr_for_level_66;
				case "level_67":
					return used_number_pieces_arr_for_level_67;
				case "level_68":
					return used_number_pieces_arr_for_level_68;
				case "level_69":
					return used_number_pieces_arr_for_level_69;
				case "level_70":
					return used_number_pieces_arr_for_level_70;
				case "level_71":
					return used_number_pieces_arr_for_level_71;
				case "level_72":
					return used_number_pieces_arr_for_level_72;
				case "level_73":
					return used_number_pieces_arr_for_level_73;
				case "level_74":
					return used_number_pieces_arr_for_level_74;
				case "level_75":
					return used_number_pieces_arr_for_level_75;
				case "level_76":
					return used_number_pieces_arr_for_level_76;
				case "level_77":
					return used_number_pieces_arr_for_level_77;
				case "level_78":
					return used_number_pieces_arr_for_level_78;
				case "level_79":
					return used_number_pieces_arr_for_level_79;
				case "level_80":
					return used_number_pieces_arr_for_level_80;
				case "level_81":
					return used_number_pieces_arr_for_level_81;
				case "level_82":
					return used_number_pieces_arr_for_level_82;
				case "level_83":
					return used_number_pieces_arr_for_level_83;
				case "level_84":
					return used_number_pieces_arr_for_level_84;
				case "level_85":
					return used_number_pieces_arr_for_level_85;
				case "level_86":
					return used_number_pieces_arr_for_level_86;
				case "level_87":
					return used_number_pieces_arr_for_level_87;
				case "level_88":
					return used_number_pieces_arr_for_level_88;
				case "level_89":
					return used_number_pieces_arr_for_level_89;
				case "level_90":
					return used_number_pieces_arr_for_level_90;
				case "level_91":
					return used_number_pieces_arr_for_level_91;
				case "level_92":
					return used_number_pieces_arr_for_level_92;
				case "level_93":
					return used_number_pieces_arr_for_level_93;
				case "level_94":
					return used_number_pieces_arr_for_level_94;
				case "level_95":
					return used_number_pieces_arr_for_level_95;
				case "level_96":
					return used_number_pieces_arr_for_level_96;
				case "level_97":
					return used_number_pieces_arr_for_level_97;
				case "level_98":
					return used_number_pieces_arr_for_level_98;
				case "level_99":
					return used_number_pieces_arr_for_level_99;
				case "level_100":
					return used_number_pieces_arr_for_level_100;
				case "level_101":
					return used_number_pieces_arr_for_level_101;
				case "level_102":
					return used_number_pieces_arr_for_level_102;
				case "level_103":
					return used_number_pieces_arr_for_level_103;
				case "level_104":
					return used_number_pieces_arr_for_level_104;
				case "level_105":
					return used_number_pieces_arr_for_level_105;
				case "level_106":
					return used_number_pieces_arr_for_level_106;
				case "level_107":
					return used_number_pieces_arr_for_level_107;
				case "level_108":
					return used_number_pieces_arr_for_level_108;
				case "level_109":
					return used_number_pieces_arr_for_level_109;
				case "level_110":
					return used_number_pieces_arr_for_level_110;
				case "level_111":
					return used_number_pieces_arr_for_level_111;
				case "level_112":
					return used_number_pieces_arr_for_level_112;
				case "level_113":
					return used_number_pieces_arr_for_level_113;
				case "level_114":
					return used_number_pieces_arr_for_level_114;
				case "level_115":
					return used_number_pieces_arr_for_level_115;
				case "level_116":
					return used_number_pieces_arr_for_level_116;
				case "level_117":
					return used_number_pieces_arr_for_level_117;
				case "level_118":
					return used_number_pieces_arr_for_level_118;
				case "level_119":
					return used_number_pieces_arr_for_level_119;
				case "level_120":
					return used_number_pieces_arr_for_level_120;
				case "level_121":
					return used_number_pieces_arr_for_level_121;
				case "level_122":
					return used_number_pieces_arr_for_level_122;
				case "level_123":
					return used_number_pieces_arr_for_level_123;
				case "level_124":
					return used_number_pieces_arr_for_level_124;
				case "level_125":
					return used_number_pieces_arr_for_level_125;
				case "level_126":
					return used_number_pieces_arr_for_level_126;
				case "level_127":
					return used_number_pieces_arr_for_level_127;
				case "level_128":
					return used_number_pieces_arr_for_level_128;
				case "level_129":
					return used_number_pieces_arr_for_level_129;
				case "level_130":
					return used_number_pieces_arr_for_level_130;
				case "level_131":
					return used_number_pieces_arr_for_level_131;
				case "level_132":
					return used_number_pieces_arr_for_level_132;
				case "level_133":
					return used_number_pieces_arr_for_level_133;
				case "level_134":
					return used_number_pieces_arr_for_level_134;
				case "level_135":
					return used_number_pieces_arr_for_level_135;
				case "level_136":
					return used_number_pieces_arr_for_level_136;
				case "level_137":
					return used_number_pieces_arr_for_level_137;
				case "level_138":
					return used_number_pieces_arr_for_level_138;
				case "level_139":
					return used_number_pieces_arr_for_level_139;
				case "level_140":
					return used_number_pieces_arr_for_level_140;
				case "level_141":
					return used_number_pieces_arr_for_level_141;
				case "level_142":
					return used_number_pieces_arr_for_level_142;
				case "level_143":
					return used_number_pieces_arr_for_level_143;
				case "level_144":
					return used_number_pieces_arr_for_level_144;
				case "level_145":
					return used_number_pieces_arr_for_level_145;
				case "level_146":
					return used_number_pieces_arr_for_level_146;
				case "level_147":
					return used_number_pieces_arr_for_level_147;
				case "level_148":
					return used_number_pieces_arr_for_level_148;
				case "level_149":
					return used_number_pieces_arr_for_level_149;
				case "level_150":
					return used_number_pieces_arr_for_level_150;
				case "level_151":
					return used_number_pieces_arr_for_level_151;
				case "level_152":
					return used_number_pieces_arr_for_level_152;
				case "level_153":
					return used_number_pieces_arr_for_level_153;
				case "level_154":
					return used_number_pieces_arr_for_level_154;
				case "level_155":
					return used_number_pieces_arr_for_level_155;
				case "level_156":
					return used_number_pieces_arr_for_level_156;
				case "level_157":
					return used_number_pieces_arr_for_level_157;
				case "level_158":
					return used_number_pieces_arr_for_level_158;
				case "level_159":
					return used_number_pieces_arr_for_level_159;
				case "level_160":
					return used_number_pieces_arr_for_level_160;
				case "level_161":
					return used_number_pieces_arr_for_level_161;
				case "level_162":
					return used_number_pieces_arr_for_level_162;
				case "level_163":
					return used_number_pieces_arr_for_level_163;
				case "level_164":
					return used_number_pieces_arr_for_level_164;
				case "level_165":
					return used_number_pieces_arr_for_level_165;
				case "level_166":
					return used_number_pieces_arr_for_level_166;
				case "level_167":
					return used_number_pieces_arr_for_level_167;
				case "level_168":
					return used_number_pieces_arr_for_level_168;
				case "level_169":
					return used_number_pieces_arr_for_level_169;
				case "level_170":
					return used_number_pieces_arr_for_level_170;
				case "level_171":
					return used_number_pieces_arr_for_level_171;
				case "level_172":
					return used_number_pieces_arr_for_level_172;
				case "level_173":
					return used_number_pieces_arr_for_level_173;
				case "level_174":
					return used_number_pieces_arr_for_level_174;
				case "level_175":
					return used_number_pieces_arr_for_level_175;
				case "level_176":
					return used_number_pieces_arr_for_level_176;
				case "level_177":
					return used_number_pieces_arr_for_level_177;
				case "level_178":
					return used_number_pieces_arr_for_level_178;
				case "level_179":
					return used_number_pieces_arr_for_level_179;
				case "level_180":
					return used_number_pieces_arr_for_level_180;
				case "level_181":
					return used_number_pieces_arr_for_level_181;
				case "level_182":
					return used_number_pieces_arr_for_level_182;
				case "level_183":
					return used_number_pieces_arr_for_level_183;
				case "level_184":
					return used_number_pieces_arr_for_level_184;
				case "level_185":
					return used_number_pieces_arr_for_level_185;
				case "level_186":
					return used_number_pieces_arr_for_level_186;
				case "level_187":
					return used_number_pieces_arr_for_level_187;
				case "level_188":
					return used_number_pieces_arr_for_level_188;
				case "level_189":
					return used_number_pieces_arr_for_level_189;
				case "level_190":
					return used_number_pieces_arr_for_level_190;
				case "level_191":
					return used_number_pieces_arr_for_level_191;
				case "level_192":
					return used_number_pieces_arr_for_level_192;
				case "level_193":
					return used_number_pieces_arr_for_level_193;
				case "level_194":
					return used_number_pieces_arr_for_level_194;
				case "level_195":
					return used_number_pieces_arr_for_level_195;
				case "level_196":
					return used_number_pieces_arr_for_level_196;
				case "level_197":
					return used_number_pieces_arr_for_level_197;
				case "level_198":
					return used_number_pieces_arr_for_level_198;
				case "level_199":
					return used_number_pieces_arr_for_level_199;
				case "level_200":
					return used_number_pieces_arr_for_level_200;
				case "level_201":
					return used_number_pieces_arr_for_level_201;
				case "level_202":
					return used_number_pieces_arr_for_level_202;
				case "level_203":
					return used_number_pieces_arr_for_level_203;
				case "level_204":
					return used_number_pieces_arr_for_level_204;
				case "level_205":
					return used_number_pieces_arr_for_level_205;
				case "level_206":
					return used_number_pieces_arr_for_level_206;
				case "level_207":
					return used_number_pieces_arr_for_level_207;
				case "level_208":
					return used_number_pieces_arr_for_level_208;
				case "level_209":
					return used_number_pieces_arr_for_level_209;
				case "level_210":
					return used_number_pieces_arr_for_level_210;
				case "level_211":
					return used_number_pieces_arr_for_level_211;
				case "level_212":
					return used_number_pieces_arr_for_level_212;
				case "level_213":
					return used_number_pieces_arr_for_level_213;
				case "level_214":
					return used_number_pieces_arr_for_level_214;
				case "level_215":
					return used_number_pieces_arr_for_level_215;
				case "level_216":
					return used_number_pieces_arr_for_level_216;
				case "level_217":
					return used_number_pieces_arr_for_level_217;
				case "level_218":
					return used_number_pieces_arr_for_level_218;
				case "level_219":
					return used_number_pieces_arr_for_level_219;
				case "level_220":
					return used_number_pieces_arr_for_level_220;
				case "level_221":
					return used_number_pieces_arr_for_level_221;
				case "level_222":
					return used_number_pieces_arr_for_level_222;
				case "level_223":
					return used_number_pieces_arr_for_level_223;
				case "level_224":
					return used_number_pieces_arr_for_level_224;
				case "level_225":
					return used_number_pieces_arr_for_level_225;
				case "level_226":
					return used_number_pieces_arr_for_level_226;
				case "level_227":
					return used_number_pieces_arr_for_level_227;
				case "level_228":
					return used_number_pieces_arr_for_level_228;
				case "level_229":
					return used_number_pieces_arr_for_level_229;
				case "level_230":
					return used_number_pieces_arr_for_level_230;
				case "level_231":
					return used_number_pieces_arr_for_level_231;
				case "level_232":
					return used_number_pieces_arr_for_level_232;
				case "level_233":
					return used_number_pieces_arr_for_level_233;
				case "level_234":
					return used_number_pieces_arr_for_level_234;
				case "level_235":
					return used_number_pieces_arr_for_level_235;
				case "level_236":
					return used_number_pieces_arr_for_level_236;
				case "level_237":
					return used_number_pieces_arr_for_level_237;
				case "level_238":
					return used_number_pieces_arr_for_level_238;
				case "level_239":
					return used_number_pieces_arr_for_level_239;
				case "level_240":
					return used_number_pieces_arr_for_level_240;
				case "level_241":
					return used_number_pieces_arr_for_level_241;
				case "level_242":
					return used_number_pieces_arr_for_level_242;
				case "level_243":
					return used_number_pieces_arr_for_level_243;
				case "level_244":
					return used_number_pieces_arr_for_level_244;
				case "level_245":
					return used_number_pieces_arr_for_level_245;
				case "level_246":
					return used_number_pieces_arr_for_level_246;
				case "level_247":
					return used_number_pieces_arr_for_level_247;
				case "level_248":
					return used_number_pieces_arr_for_level_248;
				case "level_249":
					return used_number_pieces_arr_for_level_249;
				case "level_250":
					return used_number_pieces_arr_for_level_250;
				case "level_251":
					return used_number_pieces_arr_for_level_251;
				case "level_252":
					return used_number_pieces_arr_for_level_252;
				case "level_253":
					return used_number_pieces_arr_for_level_253;
				case "level_254":
					return used_number_pieces_arr_for_level_254;
				case "level_255":
					return used_number_pieces_arr_for_level_255;
				case "level_256":
					return used_number_pieces_arr_for_level_256;
				case "level_257":
					return used_number_pieces_arr_for_level_257;
				case "level_258":
					return used_number_pieces_arr_for_level_258;
				case "level_259":
					return used_number_pieces_arr_for_level_259;
				case "level_260":
					return used_number_pieces_arr_for_level_260;
				case "level_261":
					return used_number_pieces_arr_for_level_261;
				case "level_262":
					return used_number_pieces_arr_for_level_262;
				case "level_263":
					return used_number_pieces_arr_for_level_263;
				case "level_264":
					return used_number_pieces_arr_for_level_264;
				case "level_265":
					return used_number_pieces_arr_for_level_265;
				case "level_266":
					return used_number_pieces_arr_for_level_266;
				case "level_267":
					return used_number_pieces_arr_for_level_267;
				case "level_268":
					return used_number_pieces_arr_for_level_268;
				case "level_269":
					return used_number_pieces_arr_for_level_269;
				case "level_270":
					return used_number_pieces_arr_for_level_270;
				case "level_271":
					return used_number_pieces_arr_for_level_271;
				case "level_272":
					return used_number_pieces_arr_for_level_272;
				case "level_273":
					return used_number_pieces_arr_for_level_273;
				case "level_274":
					return used_number_pieces_arr_for_level_274;
				case "level_275":
					return used_number_pieces_arr_for_level_275;
				case "level_276":
					return used_number_pieces_arr_for_level_276;
				case "level_277":
					return used_number_pieces_arr_for_level_277;
				case "level_278":
					return used_number_pieces_arr_for_level_278;
				case "level_279":
					return used_number_pieces_arr_for_level_279;
				case "level_280":
					return used_number_pieces_arr_for_level_280;
				case "level_281":
					return used_number_pieces_arr_for_level_281;
				case "level_282":
					return used_number_pieces_arr_for_level_282;
				case "level_283":
					return used_number_pieces_arr_for_level_283;
				case "level_284":
					return used_number_pieces_arr_for_level_284;
				case "level_285":
					return used_number_pieces_arr_for_level_285;
				case "level_286":
					return used_number_pieces_arr_for_level_286;
				case "level_287":
					return used_number_pieces_arr_for_level_287;
				case "level_288":
					return used_number_pieces_arr_for_level_288;
				case "level_289":
					return used_number_pieces_arr_for_level_289;
				case "level_290":
					return used_number_pieces_arr_for_level_290;
				case "level_291":
					return used_number_pieces_arr_for_level_291;
				case "level_292":
					return used_number_pieces_arr_for_level_292;
				case "level_293":
					return used_number_pieces_arr_for_level_293;
				case "level_294":
					return used_number_pieces_arr_for_level_294;
				case "level_295":
					return used_number_pieces_arr_for_level_295;
				case "level_296":
					return used_number_pieces_arr_for_level_296;
				case "level_297":
					return used_number_pieces_arr_for_level_297;
				case "level_298":
					return used_number_pieces_arr_for_level_298;
				case "level_299":
					return used_number_pieces_arr_for_level_299;
				case "level_300":
					return used_number_pieces_arr_for_level_300;
				case "level_301":
					return used_number_pieces_arr_for_level_301;
				case "level_302":
					return used_number_pieces_arr_for_level_302;
				case "level_303":
					return used_number_pieces_arr_for_level_303;
				case "level_304":
					return used_number_pieces_arr_for_level_304;
				case "level_305":
					return used_number_pieces_arr_for_level_305;
				case "level_306":
					return used_number_pieces_arr_for_level_306;
				case "level_307":
					return used_number_pieces_arr_for_level_307;
				case "level_308":
					return used_number_pieces_arr_for_level_308;
				case "level_309":
					return used_number_pieces_arr_for_level_309;
				case "level_310":
					return used_number_pieces_arr_for_level_310;
				case "level_311":
					return used_number_pieces_arr_for_level_311;
				case "level_312":
					return used_number_pieces_arr_for_level_312;
				case "level_313":
					return used_number_pieces_arr_for_level_313;
				case "level_314":
					return used_number_pieces_arr_for_level_314;
				case "level_315":
					return used_number_pieces_arr_for_level_315;
				case "level_316":
					return used_number_pieces_arr_for_level_316;
				case "level_317":
					return used_number_pieces_arr_for_level_317;
				case "level_318":
					return used_number_pieces_arr_for_level_318;
				case "level_319":
					return used_number_pieces_arr_for_level_319;
				case "level_320":
					return used_number_pieces_arr_for_level_320;
				case "level_321":
					return used_number_pieces_arr_for_level_321;
				case "level_322":
					return used_number_pieces_arr_for_level_322;
				case "level_323":
					return used_number_pieces_arr_for_level_323;
				case "level_324":
					return used_number_pieces_arr_for_level_324;
				case "level_325":
					return used_number_pieces_arr_for_level_325;
				case "level_326":
					return used_number_pieces_arr_for_level_326;
				case "level_327":
					return used_number_pieces_arr_for_level_327;
				case "level_328":
					return used_number_pieces_arr_for_level_328;
				case "level_329":
					return used_number_pieces_arr_for_level_329;
				case "level_330":
					return used_number_pieces_arr_for_level_330;
				case "level_331":
					return used_number_pieces_arr_for_level_331;
				case "level_332":
					return used_number_pieces_arr_for_level_332;
				case "level_333":
					return used_number_pieces_arr_for_level_333;
				case "level_334":
					return used_number_pieces_arr_for_level_334;
				case "level_335":
					return used_number_pieces_arr_for_level_335;
				case "level_336":
					return used_number_pieces_arr_for_level_336;
				case "level_337":
					return used_number_pieces_arr_for_level_337;
				case "level_338":
					return used_number_pieces_arr_for_level_338;
				case "level_339":
					return used_number_pieces_arr_for_level_339;
				case "level_340":
					return used_number_pieces_arr_for_level_340;
				case "level_341":
					return used_number_pieces_arr_for_level_341;
				case "level_342":
					return used_number_pieces_arr_for_level_342;
				case "level_343":
					return used_number_pieces_arr_for_level_343;
				case "level_344":
					return used_number_pieces_arr_for_level_344;
				case "level_345":
					return used_number_pieces_arr_for_level_345;
				case "level_346":
					return used_number_pieces_arr_for_level_346;
				case "level_347":
					return used_number_pieces_arr_for_level_347;
				case "level_348":
					return used_number_pieces_arr_for_level_348;
				case "level_349":
					return used_number_pieces_arr_for_level_349;
				case "level_350":
					return used_number_pieces_arr_for_level_350;
				case "level_351":
					return used_number_pieces_arr_for_level_351;
				case "level_352":
					return used_number_pieces_arr_for_level_352;
				case "level_353":
					return used_number_pieces_arr_for_level_353;
				case "level_354":
					return used_number_pieces_arr_for_level_354;
				case "level_355":
					return used_number_pieces_arr_for_level_355;
				case "level_356":
					return used_number_pieces_arr_for_level_356;
				case "level_357":
					return used_number_pieces_arr_for_level_357;
				case "level_358":
					return used_number_pieces_arr_for_level_358;
				case "level_359":
					return used_number_pieces_arr_for_level_359;
				case "level_360":
					return used_number_pieces_arr_for_level_360;
				case "level_361":
					return used_number_pieces_arr_for_level_361;
				case "level_362":
					return used_number_pieces_arr_for_level_362;
				case "level_363":
					return used_number_pieces_arr_for_level_363;
				case "level_364":
					return used_number_pieces_arr_for_level_364;
				case "level_365":
					return used_number_pieces_arr_for_level_365;
				case "level_366":
					return used_number_pieces_arr_for_level_366;
				case "level_367":
					return used_number_pieces_arr_for_level_367;
				case "level_368":
					return used_number_pieces_arr_for_level_368;
				case "level_369":
					return used_number_pieces_arr_for_level_369;
				case "level_370":
					return used_number_pieces_arr_for_level_370;
				case "level_371":
					return used_number_pieces_arr_for_level_371;
				case "level_372":
					return used_number_pieces_arr_for_level_372;
				case "level_373":
					return used_number_pieces_arr_for_level_373;
				case "level_374":
					return used_number_pieces_arr_for_level_374;
				case "level_375":
					return used_number_pieces_arr_for_level_375;
				case "level_376":
					return used_number_pieces_arr_for_level_376;
				case "level_377":
					return used_number_pieces_arr_for_level_377;
				case "level_378":
					return used_number_pieces_arr_for_level_378;
				case "level_379":
					return used_number_pieces_arr_for_level_379;
				case "level_380":
					return used_number_pieces_arr_for_level_380;
				case "level_381":
					return used_number_pieces_arr_for_level_381;
				case "level_382":
					return used_number_pieces_arr_for_level_382;
				case "level_383":
					return used_number_pieces_arr_for_level_383;
				case "level_384":
					return used_number_pieces_arr_for_level_384;
				case "level_385":
					return used_number_pieces_arr_for_level_385;
				case "level_386":
					return used_number_pieces_arr_for_level_386;
				case "level_387":
					return used_number_pieces_arr_for_level_387;
				case "level_388":
					return used_number_pieces_arr_for_level_388;
				case "level_389":
					return used_number_pieces_arr_for_level_389;
				case "level_390":
					return used_number_pieces_arr_for_level_390;
				case "level_391":
					return used_number_pieces_arr_for_level_391;
				case "level_392":
					return used_number_pieces_arr_for_level_392;
				case "level_393":
					return used_number_pieces_arr_for_level_393;
				case "level_394":
					return used_number_pieces_arr_for_level_394;
				case "level_395":
					return used_number_pieces_arr_for_level_395;
				case "level_396":
					return used_number_pieces_arr_for_level_396;
				case "level_397":
					return used_number_pieces_arr_for_level_397;
				case "level_398":
					return used_number_pieces_arr_for_level_398;
				case "level_399":
					return used_number_pieces_arr_for_level_399;
				case "level_400":
					return used_number_pieces_arr_for_level_400;
				case "level_401":
					return used_number_pieces_arr_for_level_401;
				case "level_402":
					return used_number_pieces_arr_for_level_402;
				case "level_403":
					return used_number_pieces_arr_for_level_403;
				case "level_404":
					return used_number_pieces_arr_for_level_404;
				case "level_405":
					return used_number_pieces_arr_for_level_405;
				case "level_406":
					return used_number_pieces_arr_for_level_406;
				case "level_407":
					return used_number_pieces_arr_for_level_407;
				case "level_408":
					return used_number_pieces_arr_for_level_408;
				case "level_409":
					return used_number_pieces_arr_for_level_409;
				case "level_410":
					return used_number_pieces_arr_for_level_410;
				case "level_411":
					return used_number_pieces_arr_for_level_411;
				case "level_412":
					return used_number_pieces_arr_for_level_412;
				case "level_413":
					return used_number_pieces_arr_for_level_413;
				case "level_414":
					return used_number_pieces_arr_for_level_414;
				case "level_415":
					return used_number_pieces_arr_for_level_415;
				case "level_416":
					return used_number_pieces_arr_for_level_416;
				case "level_417":
					return used_number_pieces_arr_for_level_417;
				case "level_418":
					return used_number_pieces_arr_for_level_418;
				case "level_419":
					return used_number_pieces_arr_for_level_419;
				case "level_420":
					return used_number_pieces_arr_for_level_420;
				case "level_421":
					return used_number_pieces_arr_for_level_421;
				case "level_422":
					return used_number_pieces_arr_for_level_422;
				case "level_423":
					return used_number_pieces_arr_for_level_423;
				case "level_424":
					return used_number_pieces_arr_for_level_424;
				case "level_425":
					return used_number_pieces_arr_for_level_425;
				case "level_426":
					return used_number_pieces_arr_for_level_426;
				case "level_427":
					return used_number_pieces_arr_for_level_427;
				case "level_428":
					return used_number_pieces_arr_for_level_428;
				case "level_429":
					return used_number_pieces_arr_for_level_429;
				case "level_430":
					return used_number_pieces_arr_for_level_430;
				case "level_431":
					return used_number_pieces_arr_for_level_431;
				case "level_432":
					return used_number_pieces_arr_for_level_432;
				case "level_433":
					return used_number_pieces_arr_for_level_433;
				case "level_434":
					return used_number_pieces_arr_for_level_434;
				case "level_435":
					return used_number_pieces_arr_for_level_435;
				case "level_436":
					return used_number_pieces_arr_for_level_436;
				case "level_437":
					return used_number_pieces_arr_for_level_437;
				case "level_438":
					return used_number_pieces_arr_for_level_438;
				case "level_439":
					return used_number_pieces_arr_for_level_439;
				case "level_440":
					return used_number_pieces_arr_for_level_440;
				case "level_441":
					return used_number_pieces_arr_for_level_441;
				case "level_442":
					return used_number_pieces_arr_for_level_442;
				case "level_443":
					return used_number_pieces_arr_for_level_443;
				case "level_444":
					return used_number_pieces_arr_for_level_444;
				case "level_445":
					return used_number_pieces_arr_for_level_445;
				case "level_446":
					return used_number_pieces_arr_for_level_446;
				case "level_447":
					return used_number_pieces_arr_for_level_447;
				case "level_448":
					return used_number_pieces_arr_for_level_448;
				case "level_449":
					return used_number_pieces_arr_for_level_449;
				case "level_450":
					return used_number_pieces_arr_for_level_450;
				case "level_451":
					return used_number_pieces_arr_for_level_451;
				case "level_452":
					return used_number_pieces_arr_for_level_452;
				case "level_453":
					return used_number_pieces_arr_for_level_453;
				case "level_454":
					return used_number_pieces_arr_for_level_454;
				case "level_455":
					return used_number_pieces_arr_for_level_455;
				case "level_456":
					return used_number_pieces_arr_for_level_456;
				case "level_457":
					return used_number_pieces_arr_for_level_457;
				case "level_458":
					return used_number_pieces_arr_for_level_458;
				case "level_459":
					return used_number_pieces_arr_for_level_459;
				case "level_460":
					return used_number_pieces_arr_for_level_460;
				case "level_461":
					return used_number_pieces_arr_for_level_461;
				case "level_462":
					return used_number_pieces_arr_for_level_462;
				case "level_463":
					return used_number_pieces_arr_for_level_463;
				case "level_464":
					return used_number_pieces_arr_for_level_464;
				case "level_465":
					return used_number_pieces_arr_for_level_465;
				case "level_466":
					return used_number_pieces_arr_for_level_466;
				case "level_467":
					return used_number_pieces_arr_for_level_467;
				case "level_468":
					return used_number_pieces_arr_for_level_468;
				case "level_469":
					return used_number_pieces_arr_for_level_469;
				case "level_470":
					return used_number_pieces_arr_for_level_470;
				case "level_471":
					return used_number_pieces_arr_for_level_471;
				case "level_472":
					return used_number_pieces_arr_for_level_472;
				case "level_473":
					return used_number_pieces_arr_for_level_473;
				case "level_474":
					return used_number_pieces_arr_for_level_474;
				case "level_475":
					return used_number_pieces_arr_for_level_475;
				case "level_476":
					return used_number_pieces_arr_for_level_476;
				case "level_477":
					return used_number_pieces_arr_for_level_477;
				case "level_478":
					return used_number_pieces_arr_for_level_478;
				case "level_479":
					return used_number_pieces_arr_for_level_479;
				case "level_480":
					return used_number_pieces_arr_for_level_480;
				case "level_481":
					return used_number_pieces_arr_for_level_481;
				case "level_482":
					return used_number_pieces_arr_for_level_482;
				case "level_483":
					return used_number_pieces_arr_for_level_483;
				case "level_484":
					return used_number_pieces_arr_for_level_484;
				case "level_485":
					return used_number_pieces_arr_for_level_485;
				case "level_486":
					return used_number_pieces_arr_for_level_486;
				case "level_487":
					return used_number_pieces_arr_for_level_487;
				case "level_488":
					return used_number_pieces_arr_for_level_488;
				case "level_489":
					return used_number_pieces_arr_for_level_489;
				case "level_490":
					return used_number_pieces_arr_for_level_490;
				case "level_491":
					return used_number_pieces_arr_for_level_491;
				case "level_492":
					return used_number_pieces_arr_for_level_492;
				case "level_493":
					return used_number_pieces_arr_for_level_493;
				case "level_494":
					return used_number_pieces_arr_for_level_494;
				case "level_495":
					return used_number_pieces_arr_for_level_495;
				case "level_496":
					return used_number_pieces_arr_for_level_496;
				case "level_497":
					return used_number_pieces_arr_for_level_497;
				case "level_498":
					return used_number_pieces_arr_for_level_498;
				case "level_499":
					return used_number_pieces_arr_for_level_499;
				case "level_500":
					return used_number_pieces_arr_for_level_500;
				case "level_501":
					return used_number_pieces_arr_for_level_501;
				case "level_502":
					return used_number_pieces_arr_for_level_502;
				case "level_503":
					return used_number_pieces_arr_for_level_503;
				case "level_504":
					return used_number_pieces_arr_for_level_504;
				case "level_505":
					return used_number_pieces_arr_for_level_505;
				case "level_506":
					return used_number_pieces_arr_for_level_506;
				case "level_507":
					return used_number_pieces_arr_for_level_507;
				case "level_508":
					return used_number_pieces_arr_for_level_508;
				case "level_509":
					return used_number_pieces_arr_for_level_509;
				case "level_510":
					return used_number_pieces_arr_for_level_510;
				case "level_511":
					return used_number_pieces_arr_for_level_511;
				case "level_512":
					return used_number_pieces_arr_for_level_512;
				case "level_513":
					return used_number_pieces_arr_for_level_513;
				case "level_514":
					return used_number_pieces_arr_for_level_514;
				case "level_515":
					return used_number_pieces_arr_for_level_515;
				case "level_516":
					return used_number_pieces_arr_for_level_516;
				case "level_517":
					return used_number_pieces_arr_for_level_517;
				case "level_518":
					return used_number_pieces_arr_for_level_518;
				case "level_519":
					return used_number_pieces_arr_for_level_519;
				case "level_520":
					return used_number_pieces_arr_for_level_520;
				case "level_521":
					return used_number_pieces_arr_for_level_521;
				case "level_522":
					return used_number_pieces_arr_for_level_522;
				case "level_523":
					return used_number_pieces_arr_for_level_523;
				case "level_524":
					return used_number_pieces_arr_for_level_524;
				case "level_525":
					return used_number_pieces_arr_for_level_525;
				case "level_526":
					return used_number_pieces_arr_for_level_526;
				case "level_527":
					return used_number_pieces_arr_for_level_527;
				case "level_528":
					return used_number_pieces_arr_for_level_528;
				case "level_529":
					return used_number_pieces_arr_for_level_529;
				case "level_530":
					return used_number_pieces_arr_for_level_530;
				case "level_531":
					return used_number_pieces_arr_for_level_531;
				case "level_532":
					return used_number_pieces_arr_for_level_532;
				case "level_533":
					return used_number_pieces_arr_for_level_533;
				case "level_534":
					return used_number_pieces_arr_for_level_534;
				case "level_535":
					return used_number_pieces_arr_for_level_535;
				case "level_536":
					return used_number_pieces_arr_for_level_536;
				case "level_537":
					return used_number_pieces_arr_for_level_537;
				case "level_538":
					return used_number_pieces_arr_for_level_538;
				case "level_539":
					return used_number_pieces_arr_for_level_539;
				case "level_540":
					return used_number_pieces_arr_for_level_540;
				case "level_541":
					return used_number_pieces_arr_for_level_541;
				case "level_542":
					return used_number_pieces_arr_for_level_542;
				case "level_543":
					return used_number_pieces_arr_for_level_543;
				case "level_544":
					return used_number_pieces_arr_for_level_544;
				case "level_545":
					return used_number_pieces_arr_for_level_545;
				case "level_546":
					return used_number_pieces_arr_for_level_546;
				case "level_547":
					return used_number_pieces_arr_for_level_547;
				case "level_548":
					return used_number_pieces_arr_for_level_548;
				case "level_549":
					return used_number_pieces_arr_for_level_549;
				case "level_550":
					return used_number_pieces_arr_for_level_550;
				case "level_551":
					return used_number_pieces_arr_for_level_551;
				case "level_552":
					return used_number_pieces_arr_for_level_552;
				case "level_553":
					return used_number_pieces_arr_for_level_553;
				case "level_554":
					return used_number_pieces_arr_for_level_554;
				case "level_555":
					return used_number_pieces_arr_for_level_555;
				case "level_556":
					return used_number_pieces_arr_for_level_556;
				case "level_557":
					return used_number_pieces_arr_for_level_557;
				case "level_558":
					return used_number_pieces_arr_for_level_558;
				case "level_559":
					return used_number_pieces_arr_for_level_559;
				case "level_560":
					return used_number_pieces_arr_for_level_560;
				case "level_561":
					return used_number_pieces_arr_for_level_561;
				case "level_562":
					return used_number_pieces_arr_for_level_562;
				case "level_563":
					return used_number_pieces_arr_for_level_563;
				case "level_564":
					return used_number_pieces_arr_for_level_564;
				case "level_565":
					return used_number_pieces_arr_for_level_565;
				case "level_566":
					return used_number_pieces_arr_for_level_566;
				case "level_567":
					return used_number_pieces_arr_for_level_567;
				case "level_568":
					return used_number_pieces_arr_for_level_568;
				case "level_569":
					return used_number_pieces_arr_for_level_569;
				case "level_570":
					return used_number_pieces_arr_for_level_570;
				case "level_571":
					return used_number_pieces_arr_for_level_571;
				case "level_572":
					return used_number_pieces_arr_for_level_572;
				case "level_573":
					return used_number_pieces_arr_for_level_573;
				case "level_574":
					return used_number_pieces_arr_for_level_574;
				case "level_575":
					return used_number_pieces_arr_for_level_575;
				case "level_576":
					return used_number_pieces_arr_for_level_576;
				case "level_577":
					return used_number_pieces_arr_for_level_577;
				case "level_578":
					return used_number_pieces_arr_for_level_578;
				case "level_579":
					return used_number_pieces_arr_for_level_579;
				case "level_580":
					return used_number_pieces_arr_for_level_580;
				case "level_581":
					return used_number_pieces_arr_for_level_581;
				case "level_582":
					return used_number_pieces_arr_for_level_582;
				case "level_583":
					return used_number_pieces_arr_for_level_583;
				case "level_584":
					return used_number_pieces_arr_for_level_584;
				case "level_585":
					return used_number_pieces_arr_for_level_585;
				case "level_586":
					return used_number_pieces_arr_for_level_586;
				case "level_587":
					return used_number_pieces_arr_for_level_587;
				case "level_588":
					return used_number_pieces_arr_for_level_588;
				case "level_589":
					return used_number_pieces_arr_for_level_589;
				case "level_590":
					return used_number_pieces_arr_for_level_590;
				case "level_591":
					return used_number_pieces_arr_for_level_591;
				case "level_592":
					return used_number_pieces_arr_for_level_592;
				case "level_593":
					return used_number_pieces_arr_for_level_593;
				case "level_594":
					return used_number_pieces_arr_for_level_594;
				case "level_595":
					return used_number_pieces_arr_for_level_595;
				case "level_596":
					return used_number_pieces_arr_for_level_596;
				case "level_597":
					return used_number_pieces_arr_for_level_597;
				case "level_598":
					return used_number_pieces_arr_for_level_598;
				case "level_599":
					return used_number_pieces_arr_for_level_599;
				case "level_600":
					return used_number_pieces_arr_for_level_600;
				case "level_601":
					return used_number_pieces_arr_for_level_601;
				case "level_602":
					return used_number_pieces_arr_for_level_602;
				case "level_603":
					return used_number_pieces_arr_for_level_603;
				case "level_604":
					return used_number_pieces_arr_for_level_604;
				case "level_605":
					return used_number_pieces_arr_for_level_605;
				case "level_606":
					return used_number_pieces_arr_for_level_606;
				case "level_607":
					return used_number_pieces_arr_for_level_607;
				case "level_608":
					return used_number_pieces_arr_for_level_608;
				case "level_609":
					return used_number_pieces_arr_for_level_609;
				case "level_610":
					return used_number_pieces_arr_for_level_610;
				case "level_611":
					return used_number_pieces_arr_for_level_611;
				case "level_612":
					return used_number_pieces_arr_for_level_612;
				case "level_613":
					return used_number_pieces_arr_for_level_613;
				case "level_614":
					return used_number_pieces_arr_for_level_614;
				case "level_615":
					return used_number_pieces_arr_for_level_615;
				case "level_616":
					return used_number_pieces_arr_for_level_616;
				case "level_617":
					return used_number_pieces_arr_for_level_617;
				case "level_618":
					return used_number_pieces_arr_for_level_618;
				case "level_619":
					return used_number_pieces_arr_for_level_619;
				case "level_620":
					return used_number_pieces_arr_for_level_620;
				case "level_621":
					return used_number_pieces_arr_for_level_621;
				case "level_622":
					return used_number_pieces_arr_for_level_622;
				case "level_623":
					return used_number_pieces_arr_for_level_623;
				case "level_624":
					return used_number_pieces_arr_for_level_624;
				case "level_625":
					return used_number_pieces_arr_for_level_625;
				case "level_626":
					return used_number_pieces_arr_for_level_626;
				case "level_627":
					return used_number_pieces_arr_for_level_627;
				case "level_628":
					return used_number_pieces_arr_for_level_628;
				case "level_629":
					return used_number_pieces_arr_for_level_629;
				case "level_630":
					return used_number_pieces_arr_for_level_630;
				case "level_631":
					return used_number_pieces_arr_for_level_631;
				case "level_632":
					return used_number_pieces_arr_for_level_632;
				case "level_633":
					return used_number_pieces_arr_for_level_633;
				case "level_634":
					return used_number_pieces_arr_for_level_634;
				case "level_635":
					return used_number_pieces_arr_for_level_635;
				case "level_636":
					return used_number_pieces_arr_for_level_636;
				case "level_637":
					return used_number_pieces_arr_for_level_637;
				case "level_638":
					return used_number_pieces_arr_for_level_638;
				case "level_639":
					return used_number_pieces_arr_for_level_639;
				case "level_640":
					return used_number_pieces_arr_for_level_640;
				case "level_641":
					return used_number_pieces_arr_for_level_641;
				case "level_642":
					return used_number_pieces_arr_for_level_642;
				case "level_643":
					return used_number_pieces_arr_for_level_643;
				case "level_644":
					return used_number_pieces_arr_for_level_644;
				case "level_645":
					return used_number_pieces_arr_for_level_645;
				case "level_646":
					return used_number_pieces_arr_for_level_646;
				case "level_647":
					return used_number_pieces_arr_for_level_647;
				case "level_648":
					return used_number_pieces_arr_for_level_648;
				case "level_649":
					return used_number_pieces_arr_for_level_649;
				case "level_650":
					return used_number_pieces_arr_for_level_650;
				case "level_651":
					return used_number_pieces_arr_for_level_651;
				case "level_652":
					return used_number_pieces_arr_for_level_652;
				case "level_653":
					return used_number_pieces_arr_for_level_653;
				case "level_654":
					return used_number_pieces_arr_for_level_654;
				case "level_655":
					return used_number_pieces_arr_for_level_655;
				case "level_656":
					return used_number_pieces_arr_for_level_656;
				case "level_657":
					return used_number_pieces_arr_for_level_657;
				case "level_658":
					return used_number_pieces_arr_for_level_658;
				case "level_659":
					return used_number_pieces_arr_for_level_659;
				case "level_660":
					return used_number_pieces_arr_for_level_660;
				case "level_661":
					return used_number_pieces_arr_for_level_661;
				case "level_662":
					return used_number_pieces_arr_for_level_662;
				case "level_663":
					return used_number_pieces_arr_for_level_663;
				case "level_664":
					return used_number_pieces_arr_for_level_664;
				case "level_665":
					return used_number_pieces_arr_for_level_665;
				case "level_666":
					return used_number_pieces_arr_for_level_666;
				case "level_667":
					return used_number_pieces_arr_for_level_667;
				case "level_668":
					return used_number_pieces_arr_for_level_668;
				case "level_669":
					return used_number_pieces_arr_for_level_669;
				case "level_670":
					return used_number_pieces_arr_for_level_670;
				case "level_671":
					return used_number_pieces_arr_for_level_671;
				case "level_672":
					return used_number_pieces_arr_for_level_672;
				case "level_673":
					return used_number_pieces_arr_for_level_673;
				case "level_674":
					return used_number_pieces_arr_for_level_674;
				case "level_675":
					return used_number_pieces_arr_for_level_675;
				case "level_676":
					return used_number_pieces_arr_for_level_676;
				case "level_677":
					return used_number_pieces_arr_for_level_677;
				case "level_678":
					return used_number_pieces_arr_for_level_678;
				case "level_679":
					return used_number_pieces_arr_for_level_679;
				case "level_680":
					return used_number_pieces_arr_for_level_680;
				case "level_681":
					return used_number_pieces_arr_for_level_681;
				case "level_682":
					return used_number_pieces_arr_for_level_682;
				case "level_683":
					return used_number_pieces_arr_for_level_683;
				case "level_684":
					return used_number_pieces_arr_for_level_684;
				case "level_685":
					return used_number_pieces_arr_for_level_685;
				case "level_686":
					return used_number_pieces_arr_for_level_686;
				case "level_687":
					return used_number_pieces_arr_for_level_687;
				case "level_688":
					return used_number_pieces_arr_for_level_688;
				case "level_689":
					return used_number_pieces_arr_for_level_689;
				case "level_690":
					return used_number_pieces_arr_for_level_690;
				case "level_691":
					return used_number_pieces_arr_for_level_691;
				case "level_692":
					return used_number_pieces_arr_for_level_692;
				case "level_693":
					return used_number_pieces_arr_for_level_693;
				case "level_694":
					return used_number_pieces_arr_for_level_694;
				case "level_695":
					return used_number_pieces_arr_for_level_695;
				case "level_696":
					return used_number_pieces_arr_for_level_696;
				case "level_697":
					return used_number_pieces_arr_for_level_697;
				case "level_698":
					return used_number_pieces_arr_for_level_698;
				case "level_699":
					return used_number_pieces_arr_for_level_699;
				case "level_700":
					return used_number_pieces_arr_for_level_700;
				case "level_701":
					return used_number_pieces_arr_for_level_701;
				case "level_702":
					return used_number_pieces_arr_for_level_702;
				case "level_703":
					return used_number_pieces_arr_for_level_703;
				case "level_704":
					return used_number_pieces_arr_for_level_704;
				case "level_705":
					return used_number_pieces_arr_for_level_705;
				case "level_706":
					return used_number_pieces_arr_for_level_706;
				case "level_707":
					return used_number_pieces_arr_for_level_707;
				case "level_708":
					return used_number_pieces_arr_for_level_708;
				case "level_709":
					return used_number_pieces_arr_for_level_709;
				case "level_710":
					return used_number_pieces_arr_for_level_710;
				case "level_711":
					return used_number_pieces_arr_for_level_711;
				case "level_712":
					return used_number_pieces_arr_for_level_712;
				case "level_713":
					return used_number_pieces_arr_for_level_713;
				case "level_714":
					return used_number_pieces_arr_for_level_714;
				case "level_715":
					return used_number_pieces_arr_for_level_715;
				case "level_716":
					return used_number_pieces_arr_for_level_716;
				case "level_717":
					return used_number_pieces_arr_for_level_717;
				case "level_718":
					return used_number_pieces_arr_for_level_718;
				case "level_719":
					return used_number_pieces_arr_for_level_719;
				case "level_720":
					return used_number_pieces_arr_for_level_720;
				case "level_721":
					return used_number_pieces_arr_for_level_721;
				case "level_722":
					return used_number_pieces_arr_for_level_722;
				case "level_723":
					return used_number_pieces_arr_for_level_723;
				case "level_724":
					return used_number_pieces_arr_for_level_724;
				case "level_725":
					return used_number_pieces_arr_for_level_725;
				case "level_726":
					return used_number_pieces_arr_for_level_726;
				case "level_727":
					return used_number_pieces_arr_for_level_727;
				case "level_728":
					return used_number_pieces_arr_for_level_728;
				case "level_729":
					return used_number_pieces_arr_for_level_729;
				case "level_730":
					return used_number_pieces_arr_for_level_730;
				case "level_731":
					return used_number_pieces_arr_for_level_731;
				case "level_732":
					return used_number_pieces_arr_for_level_732;
				case "level_733":
					return used_number_pieces_arr_for_level_733;
				case "level_734":
					return used_number_pieces_arr_for_level_734;
				case "level_735":
					return used_number_pieces_arr_for_level_735;
				case "level_736":
					return used_number_pieces_arr_for_level_736;
				case "level_737":
					return used_number_pieces_arr_for_level_737;
				case "level_738":
					return used_number_pieces_arr_for_level_738;
				case "level_739":
					return used_number_pieces_arr_for_level_739;
				case "level_740":
					return used_number_pieces_arr_for_level_740;
				case "level_741":
					return used_number_pieces_arr_for_level_741;
				case "level_742":
					return used_number_pieces_arr_for_level_742;
				case "level_743":
					return used_number_pieces_arr_for_level_743;
				case "level_744":
					return used_number_pieces_arr_for_level_744;
				case "level_745":
					return used_number_pieces_arr_for_level_745;
				case "level_746":
					return used_number_pieces_arr_for_level_746;
				case "level_747":
					return used_number_pieces_arr_for_level_747;
				case "level_748":
					return used_number_pieces_arr_for_level_748;
				case "level_749":
					return used_number_pieces_arr_for_level_749;
				case "level_750":
					return used_number_pieces_arr_for_level_750;
				case "level_751":
					return used_number_pieces_arr_for_level_751;
				case "level_752":
					return used_number_pieces_arr_for_level_752;
				case "level_753":
					return used_number_pieces_arr_for_level_753;
				case "level_754":
					return used_number_pieces_arr_for_level_754;
				case "level_755":
					return used_number_pieces_arr_for_level_755;
				case "level_756":
					return used_number_pieces_arr_for_level_756;
				case "level_757":
					return used_number_pieces_arr_for_level_757;
				case "level_758":
					return used_number_pieces_arr_for_level_758;
				case "level_759":
					return used_number_pieces_arr_for_level_759;
				case "level_760":
					return used_number_pieces_arr_for_level_760;
				case "level_761":
					return used_number_pieces_arr_for_level_761;
				case "level_762":
					return used_number_pieces_arr_for_level_762;
				case "level_763":
					return used_number_pieces_arr_for_level_763;
				case "level_764":
					return used_number_pieces_arr_for_level_764;
				case "level_765":
					return used_number_pieces_arr_for_level_765;
				case "level_766":
					return used_number_pieces_arr_for_level_766;
				case "level_767":
					return used_number_pieces_arr_for_level_767;
				case "level_768":
					return used_number_pieces_arr_for_level_768;
				case "level_769":
					return used_number_pieces_arr_for_level_769;
				case "level_770":
					return used_number_pieces_arr_for_level_770;
				case "level_771":
					return used_number_pieces_arr_for_level_771;
				case "level_772":
					return used_number_pieces_arr_for_level_772;
				case "level_773":
					return used_number_pieces_arr_for_level_773;
				case "level_774":
					return used_number_pieces_arr_for_level_774;
				case "level_775":
					return used_number_pieces_arr_for_level_775;
				case "level_776":
					return used_number_pieces_arr_for_level_776;
				case "level_777":
					return used_number_pieces_arr_for_level_777;
				case "level_778":
					return used_number_pieces_arr_for_level_778;
				case "level_779":
					return used_number_pieces_arr_for_level_779;
				case "level_780":
					return used_number_pieces_arr_for_level_780;
				case "level_781":
					return used_number_pieces_arr_for_level_781;
				case "level_782":
					return used_number_pieces_arr_for_level_782;
				case "level_783":
					return used_number_pieces_arr_for_level_783;
				case "level_784":
					return used_number_pieces_arr_for_level_784;
				case "level_785":
					return used_number_pieces_arr_for_level_785;
				case "level_786":
					return used_number_pieces_arr_for_level_786;
				case "level_787":
					return used_number_pieces_arr_for_level_787;
				case "level_788":
					return used_number_pieces_arr_for_level_788;
				case "level_789":
					return used_number_pieces_arr_for_level_789;
				case "level_790":
					return used_number_pieces_arr_for_level_790;
				case "level_791":
					return used_number_pieces_arr_for_level_791;
				case "level_792":
					return used_number_pieces_arr_for_level_792;
				case "level_793":
					return used_number_pieces_arr_for_level_793;
				case "level_794":
					return used_number_pieces_arr_for_level_794;
				case "level_795":
					return used_number_pieces_arr_for_level_795;
				case "level_796":
					return used_number_pieces_arr_for_level_796;
				case "level_797":
					return used_number_pieces_arr_for_level_797;
				case "level_798":
					return used_number_pieces_arr_for_level_798;
				case "level_799":
					return used_number_pieces_arr_for_level_799;
				case "level_800":
					return used_number_pieces_arr_for_level_800;
				case "level_801":
					return used_number_pieces_arr_for_level_801;
				case "level_802":
					return used_number_pieces_arr_for_level_802;
				case "level_803":
					return used_number_pieces_arr_for_level_803;
				case "level_804":
					return used_number_pieces_arr_for_level_804;
				case "level_805":
					return used_number_pieces_arr_for_level_805;
				case "level_806":
					return used_number_pieces_arr_for_level_806;
				case "level_807":
					return used_number_pieces_arr_for_level_807;
				case "level_808":
					return used_number_pieces_arr_for_level_808;
				case "level_809":
					return used_number_pieces_arr_for_level_809;
				case "level_810":
					return used_number_pieces_arr_for_level_810;
				case "level_811":
					return used_number_pieces_arr_for_level_811;
				case "level_812":
					return used_number_pieces_arr_for_level_812;
				case "level_813":
					return used_number_pieces_arr_for_level_813;
				case "level_814":
					return used_number_pieces_arr_for_level_814;
				case "level_815":
					return used_number_pieces_arr_for_level_815;
				case "level_816":
					return used_number_pieces_arr_for_level_816;
				case "level_817":
					return used_number_pieces_arr_for_level_817;
				case "level_818":
					return used_number_pieces_arr_for_level_818;
				case "level_819":
					return used_number_pieces_arr_for_level_819;
				case "level_820":
					return used_number_pieces_arr_for_level_820;
				case "level_821":
					return used_number_pieces_arr_for_level_821;
				case "level_822":
					return used_number_pieces_arr_for_level_822;
				case "level_823":
					return used_number_pieces_arr_for_level_823;
				case "level_824":
					return used_number_pieces_arr_for_level_824;
				case "level_825":
					return used_number_pieces_arr_for_level_825;
				case "level_826":
					return used_number_pieces_arr_for_level_826;
				case "level_827":
					return used_number_pieces_arr_for_level_827;
				case "level_828":
					return used_number_pieces_arr_for_level_828;
				case "level_829":
					return used_number_pieces_arr_for_level_829;
				case "level_830":
					return used_number_pieces_arr_for_level_830;
				case "level_831":
					return used_number_pieces_arr_for_level_831;
				case "level_832":
					return used_number_pieces_arr_for_level_832;
				case "level_833":
					return used_number_pieces_arr_for_level_833;
				case "level_834":
					return used_number_pieces_arr_for_level_834;
				case "level_835":
					return used_number_pieces_arr_for_level_835;
				case "level_836":
					return used_number_pieces_arr_for_level_836;
				case "level_837":
					return used_number_pieces_arr_for_level_837;
				case "level_838":
					return used_number_pieces_arr_for_level_838;
				case "level_839":
					return used_number_pieces_arr_for_level_839;
				case "level_840":
					return used_number_pieces_arr_for_level_840;
				case "level_841":
					return used_number_pieces_arr_for_level_841;
				case "level_842":
					return used_number_pieces_arr_for_level_842;
				case "level_843":
					return used_number_pieces_arr_for_level_843;
				case "level_844":
					return used_number_pieces_arr_for_level_844;
				case "level_845":
					return used_number_pieces_arr_for_level_845;
				case "level_846":
					return used_number_pieces_arr_for_level_846;
				case "level_847":
					return used_number_pieces_arr_for_level_847;
				case "level_848":
					return used_number_pieces_arr_for_level_848;
				case "level_849":
					return used_number_pieces_arr_for_level_849;
				case "level_850":
					return used_number_pieces_arr_for_level_850;
				case "level_851":
					return used_number_pieces_arr_for_level_851;
				case "level_852":
					return used_number_pieces_arr_for_level_852;
				case "level_853":
					return used_number_pieces_arr_for_level_853;
				case "level_854":
					return used_number_pieces_arr_for_level_854;
				case "level_855":
					return used_number_pieces_arr_for_level_855;
				case "level_856":
					return used_number_pieces_arr_for_level_856;
				case "level_857":
					return used_number_pieces_arr_for_level_857;
				case "level_858":
					return used_number_pieces_arr_for_level_858;
				case "level_859":
					return used_number_pieces_arr_for_level_859;
				case "level_860":
					return used_number_pieces_arr_for_level_860;
				case "level_861":
					return used_number_pieces_arr_for_level_861;
				case "level_862":
					return used_number_pieces_arr_for_level_862;
				case "level_863":
					return used_number_pieces_arr_for_level_863;
				case "level_864":
					return used_number_pieces_arr_for_level_864;
				case "level_865":
					return used_number_pieces_arr_for_level_865;
				case "level_866":
					return used_number_pieces_arr_for_level_866;
				case "level_867":
					return used_number_pieces_arr_for_level_867;
				case "level_868":
					return used_number_pieces_arr_for_level_868;
				case "level_869":
					return used_number_pieces_arr_for_level_869;
				case "level_870":
					return used_number_pieces_arr_for_level_870;
				case "level_871":
					return used_number_pieces_arr_for_level_871;
				case "level_872":
					return used_number_pieces_arr_for_level_872;
				case "level_873":
					return used_number_pieces_arr_for_level_873;
				case "level_874":
					return used_number_pieces_arr_for_level_874;
				case "level_875":
					return used_number_pieces_arr_for_level_875;
				case "level_876":
					return used_number_pieces_arr_for_level_876;
				case "level_877":
					return used_number_pieces_arr_for_level_877;
				case "level_878":
					return used_number_pieces_arr_for_level_878;
				case "level_879":
					return used_number_pieces_arr_for_level_879;
				case "level_880":
					return used_number_pieces_arr_for_level_880;
				case "level_881":
					return used_number_pieces_arr_for_level_881;
				case "level_882":
					return used_number_pieces_arr_for_level_882;
				case "level_883":
					return used_number_pieces_arr_for_level_883;
				case "level_884":
					return used_number_pieces_arr_for_level_884;
				case "level_885":
					return used_number_pieces_arr_for_level_885;
				case "level_886":
					return used_number_pieces_arr_for_level_886;
				case "level_887":
					return used_number_pieces_arr_for_level_887;
				case "level_888":
					return used_number_pieces_arr_for_level_888;
				case "level_889":
					return used_number_pieces_arr_for_level_889;
				case "level_890":
					return used_number_pieces_arr_for_level_890;
				case "level_891":
					return used_number_pieces_arr_for_level_891;
				case "level_892":
					return used_number_pieces_arr_for_level_892;
				case "level_893":
					return used_number_pieces_arr_for_level_893;
				case "level_894":
					return used_number_pieces_arr_for_level_894;
				case "level_895":
					return used_number_pieces_arr_for_level_895;
				case "level_896":
					return used_number_pieces_arr_for_level_896;
				case "level_897":
					return used_number_pieces_arr_for_level_897;
				case "level_898":
					return used_number_pieces_arr_for_level_898;
				case "level_899":
					return used_number_pieces_arr_for_level_899;
				case "level_900":
					return used_number_pieces_arr_for_level_900;
				case "level_901":
					return used_number_pieces_arr_for_level_901;
				case "level_902":
					return used_number_pieces_arr_for_level_902;
				case "level_903":
					return used_number_pieces_arr_for_level_903;
				case "level_904":
					return used_number_pieces_arr_for_level_904;
				case "level_905":
					return used_number_pieces_arr_for_level_905;
				case "level_906":
					return used_number_pieces_arr_for_level_906;
				case "level_907":
					return used_number_pieces_arr_for_level_907;
				case "level_908":
					return used_number_pieces_arr_for_level_908;
				case "level_909":
					return used_number_pieces_arr_for_level_909;
				case "level_910":
					return used_number_pieces_arr_for_level_910;
				case "level_911":
					return used_number_pieces_arr_for_level_911;
				case "level_912":
					return used_number_pieces_arr_for_level_912;
				case "level_913":
					return used_number_pieces_arr_for_level_913;
				case "level_914":
					return used_number_pieces_arr_for_level_914;
				case "level_915":
					return used_number_pieces_arr_for_level_915;
				case "level_916":
					return used_number_pieces_arr_for_level_916;
				case "level_917":
					return used_number_pieces_arr_for_level_917;
				case "level_918":
					return used_number_pieces_arr_for_level_918;
				case "level_919":
					return used_number_pieces_arr_for_level_919;
				case "level_920":
					return used_number_pieces_arr_for_level_920;
				case "level_921":
					return used_number_pieces_arr_for_level_921;
				case "level_922":
					return used_number_pieces_arr_for_level_922;
				case "level_923":
					return used_number_pieces_arr_for_level_923;
				case "level_924":
					return used_number_pieces_arr_for_level_924;
				case "level_925":
					return used_number_pieces_arr_for_level_925;
				case "level_926":
					return used_number_pieces_arr_for_level_926;
				case "level_927":
					return used_number_pieces_arr_for_level_927;
				case "level_928":
					return used_number_pieces_arr_for_level_928;
				case "level_929":
					return used_number_pieces_arr_for_level_929;
				case "level_930":
					return used_number_pieces_arr_for_level_930;
				case "level_931":
					return used_number_pieces_arr_for_level_931;
				case "level_932":
					return used_number_pieces_arr_for_level_932;
				case "level_933":
					return used_number_pieces_arr_for_level_933;
				case "level_934":
					return used_number_pieces_arr_for_level_934;
				case "level_935":
					return used_number_pieces_arr_for_level_935;
				case "level_936":
					return used_number_pieces_arr_for_level_936;
				case "level_937":
					return used_number_pieces_arr_for_level_937;
				case "level_938":
					return used_number_pieces_arr_for_level_938;
				case "level_939":
					return used_number_pieces_arr_for_level_939;
				case "level_940":
					return used_number_pieces_arr_for_level_940;
				case "level_941":
					return used_number_pieces_arr_for_level_941;
				case "level_942":
					return used_number_pieces_arr_for_level_942;
				case "level_943":
					return used_number_pieces_arr_for_level_943;
				case "level_944":
					return used_number_pieces_arr_for_level_944;
				case "level_945":
					return used_number_pieces_arr_for_level_945;
				case "level_946":
					return used_number_pieces_arr_for_level_946;
				case "level_947":
					return used_number_pieces_arr_for_level_947;
				case "level_948":
					return used_number_pieces_arr_for_level_948;
				case "level_949":
					return used_number_pieces_arr_for_level_949;
				case "level_950":
					return used_number_pieces_arr_for_level_950;
				case "level_951":
					return used_number_pieces_arr_for_level_951;
				case "level_952":
					return used_number_pieces_arr_for_level_952;
				case "level_953":
					return used_number_pieces_arr_for_level_953;
				case "level_954":
					return used_number_pieces_arr_for_level_954;
				case "level_955":
					return used_number_pieces_arr_for_level_955;
				case "level_956":
					return used_number_pieces_arr_for_level_956;
				case "level_957":
					return used_number_pieces_arr_for_level_957;
				case "level_958":
					return used_number_pieces_arr_for_level_958;
				case "level_959":
					return used_number_pieces_arr_for_level_959;
				case "level_960":
					return used_number_pieces_arr_for_level_960;
				case "level_961":
					return used_number_pieces_arr_for_level_961;
				case "level_962":
					return used_number_pieces_arr_for_level_962;
				case "level_963":
					return used_number_pieces_arr_for_level_963;
				case "level_964":
					return used_number_pieces_arr_for_level_964;
				case "level_965":
					return used_number_pieces_arr_for_level_965;
				case "level_966":
					return used_number_pieces_arr_for_level_966;
				case "level_967":
					return used_number_pieces_arr_for_level_967;
				case "level_968":
					return used_number_pieces_arr_for_level_968;
				case "level_969":
					return used_number_pieces_arr_for_level_969;
				case "level_970":
					return used_number_pieces_arr_for_level_970;
				case "level_971":
					return used_number_pieces_arr_for_level_971;
				case "level_972":
					return used_number_pieces_arr_for_level_972;
				case "level_973":
					return used_number_pieces_arr_for_level_973;
				case "level_974":
					return used_number_pieces_arr_for_level_974;
				case "level_975":
					return used_number_pieces_arr_for_level_975;
				case "level_976":
					return used_number_pieces_arr_for_level_976;
				case "level_977":
					return used_number_pieces_arr_for_level_977;
				case "level_978":
					return used_number_pieces_arr_for_level_978;
				case "level_979":
					return used_number_pieces_arr_for_level_979;
				case "level_980":
					return used_number_pieces_arr_for_level_980;
				case "level_981":
					return used_number_pieces_arr_for_level_981;
				case "level_982":
					return used_number_pieces_arr_for_level_982;
				case "level_983":
					return used_number_pieces_arr_for_level_983;
				case "level_984":
					return used_number_pieces_arr_for_level_984;
				case "level_985":
					return used_number_pieces_arr_for_level_985;
				case "level_986":
					return used_number_pieces_arr_for_level_986;
				case "level_987":
					return used_number_pieces_arr_for_level_987;
				case "level_988":
					return used_number_pieces_arr_for_level_988;
				case "level_989":
					return used_number_pieces_arr_for_level_989;
				case "level_990":
					return used_number_pieces_arr_for_level_990;
				case "level_991":
					return used_number_pieces_arr_for_level_991;
				case "level_992":
					return used_number_pieces_arr_for_level_992;
				case "level_993":
					return used_number_pieces_arr_for_level_993;
				case "level_994":
					return used_number_pieces_arr_for_level_994;
				case "level_995":
					return used_number_pieces_arr_for_level_995;
				case "level_996":
					return used_number_pieces_arr_for_level_996;
				case "level_997":
					return used_number_pieces_arr_for_level_997;
				case "level_998":
					return used_number_pieces_arr_for_level_998;
				case "level_999":
					return used_number_pieces_arr_for_level_999;
				case "level_1000":
					return used_number_pieces_arr_for_level_1000;
				default:
					break;
			}
		}

		function clearBoard() {

			var used_number_pieces_arr_for_current_level = getUsedNumberPiecesArrForCurrentLevel(active_level_id);

			// empty used number pieces array for current level
			while(used_number_pieces_arr_for_current_level.length > 0) {
				used_number_pieces_arr_for_current_level.pop();
			}

			// populate used number pieces array for current level
			for(var i = 0; i < 81; i++) {
				used_number_pieces_arr_for_current_level.push(given_numbers_arr_for_current_level[i]);
			}

			if(isLocalStorageEnabled()) {
				// update changes to localStorage
				localStorage.setItem("SudokuOnline.used_number_pieces_arr_for_"+active_level_id, used_number_pieces_arr_for_current_level.toString());
			}

			// reset game board and place the given numbers back on the board
			setupGameBoard(active_level_id);
		}

		function setupGameBoard(level_id) {
			var game_board_pieces_id_arr = ["game_board_piece_1_1","game_board_piece_1_2","game_board_piece_1_3","game_board_piece_1_4","game_board_piece_1_5","game_board_piece_1_6","game_board_piece_1_7","game_board_piece_1_8","game_board_piece_1_9","game_board_piece_2_1","game_board_piece_2_2","game_board_piece_2_3","game_board_piece_2_4","game_board_piece_2_5","game_board_piece_2_6","game_board_piece_2_7","game_board_piece_2_8","game_board_piece_2_9","game_board_piece_3_1","game_board_piece_3_2","game_board_piece_3_3","game_board_piece_3_4","game_board_piece_3_5","game_board_piece_3_6","game_board_piece_3_7","game_board_piece_3_8","game_board_piece_3_9","game_board_piece_4_1","game_board_piece_4_2","game_board_piece_4_3","game_board_piece_4_4","game_board_piece_4_5","game_board_piece_4_6","game_board_piece_4_7","game_board_piece_4_8","game_board_piece_4_9","game_board_piece_5_1","game_board_piece_5_2","game_board_piece_5_3","game_board_piece_5_4","game_board_piece_5_5","game_board_piece_5_6","game_board_piece_5_7","game_board_piece_5_8","game_board_piece_5_9","game_board_piece_6_1","game_board_piece_6_2","game_board_piece_6_3","game_board_piece_6_4","game_board_piece_6_5","game_board_piece_6_6","game_board_piece_6_7","game_board_piece_6_8","game_board_piece_6_9","game_board_piece_7_1","game_board_piece_7_2","game_board_piece_7_3","game_board_piece_7_4","game_board_piece_7_5","game_board_piece_7_6","game_board_piece_7_7","game_board_piece_7_8","game_board_piece_7_9","game_board_piece_8_1","game_board_piece_8_2","game_board_piece_8_3","game_board_piece_8_4","game_board_piece_8_5","game_board_piece_8_6","game_board_piece_8_7","game_board_piece_8_8","game_board_piece_8_9","game_board_piece_9_1","game_board_piece_9_2","game_board_piece_9_3","game_board_piece_9_4","game_board_piece_9_5","game_board_piece_9_6","game_board_piece_9_7","game_board_piece_9_8","game_board_piece_9_9"];
			
			// reset game board objects
			$(".unused_number_piece_counter").html(9);
			$(".game_board_piece").css({left: "-99999px", right: "auto", color: "#FFFFFF", backgroundColor: "green"});

			var used_number_pieces_arr_for_current_level = getUsedNumberPiecesArrForCurrentLevel(level_id);

			for(var i = 0; i < 81; i++) {
				if(given_numbers_arr_for_current_level[i] != 0) {
					// if the sudoku square is filled in with a given number, initialize this square (tile)
					// on the game board with a fixed game piece indicating this number
					setGamePieceAsGivenNumber(game_board_pieces_id_arr, i);
				} else {
					if(used_number_pieces_arr_for_current_level[i] != 0) {
						$("#"+game_board_pieces_id_arr[i]).html(used_number_pieces_arr_for_current_level[i]);
						$("#"+game_board_pieces_id_arr[i]).css({left: "0", right: "0", color: "#FFFFFF", backgroundColor: "green", cursor: "pointer"});
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
			$("#"+game_board_pieces_id_arr[index]).css({left: "0", right: "0", color: "#7E7E7E", backgroundColor: "#FFFFFF", cursor: "default"});

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

		function checkTextInput(event) {
			var key_pressed = event.keyCode || event.which;
			if(key_pressed == 13) {
				var input_value = $("#navigation_panel_text_input_box").val();
				if(!$.isNumeric(input_value) || input_value < 1 || input_value > 1000) {
					displayTextInputBoxWarningForInvalidInput();
				} else {
					$("#navigation_panel_text_input_box_hint").css({left: "-99999px"});
					$("#navigation_panel_text_input_box").val("");
					LevelControl.loadLevel("level_"+input_value);
				}
			}
		}

		function displayTextInputBoxWarningForInvalidInput() {
			$("#navigation_panel_text_input_box").css({backgroundColor: "red"});
			setTimeout(function() {
				$("#navigation_panel_text_input_box").css({backgroundColor: "#FFFFFF"});
			}, 300);
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
			getGivenNumbersArrForCurrentLevel : getGivenNumbersArrForCurrentLevel,
			setUsedNumberPiecesArrForCurrentLevel : setUsedNumberPiecesArrForCurrentLevel,
			getUsedNumberPiecesArrForCurrentLevel : getUsedNumberPiecesArrForCurrentLevel,
			clearBoard : clearBoard,
			checkTextInput : checkTextInput,
			displayLoadingScreen : displayLoadingScreen
		};

		return public_objects;
	}();

	var PlayerSelections = function()
	{
		function determineAndExecutePlayerSelection(event) {
			var dragged_unused_number_piece_number = getDraggedNumberPieceNumber(event.target.id),
				used_number_pieces_arr_for_current_level = LevelControl.getUsedNumberPiecesArrForCurrentLevel(active_level_id),
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
					$("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).css({left: "0", right: "0", cursor: "pointer"});
					// update used number pieces array
					used_number_pieces_arr_for_current_level[index_of_active_tile_in_given_tiles_arr] = dragged_unused_number_piece_number;
				} else {
					highlightActiveTileOrangeAsWarning(active_tile_row_num, active_tile_column_num);
				}
			}
			checkIfLevelCompleted(used_number_pieces_arr_for_current_level);
			if(isLocalStorageEnabled()) {
				// update changes to localStorage
				localStorage.setItem("SudokuOnline.used_number_pieces_arr_for_"+active_level_id, used_number_pieces_arr_for_current_level.toString());
			}
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
				$("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).css({left: "-99999px", right: "auto"});

				// increment counter of corresponding unused game piece
				var removed_number_piece_number = $("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).html();
				var corresponding_unused_number_piece_counter = $("#unused_number_piece_"+removed_number_piece_number+"_counter").html();
				$("#unused_number_piece_"+removed_number_piece_number+"_counter").html(parseInt(corresponding_unused_number_piece_counter)+1);
				if(corresponding_unused_number_piece_counter == 0) {
					$("#unused_number_piece_"+removed_number_piece_number).css({backgroundColor: "green", cursor: "pointer"});
				}

				// update used_tiles_arr
				var used_number_pieces_arr_for_current_level = LevelControl.getUsedNumberPiecesArrForCurrentLevel(active_level_id);
				used_number_pieces_arr_for_current_level[index_of_active_tile_in_given_tiles_arr] = 0;

				// make udpates to assigned classes if needed
				checkIfChangesWereMadeToACompletedLevel();

				if(isLocalStorageEnabled()) {
					// update changes to localStorage
					localStorage.setItem("SudokuOnline.used_number_pieces_arr_for_"+active_level_id, used_number_pieces_arr_for_current_level.toString());
				}
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

		function highlightActiveTileOrangeAsWarning(active_tile_row_num, active_tile_column_num) {
			$("#game_board_tile_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"orange"});
			setTimeout(function() {
				$("#game_board_tile_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"#FFFFFF"});
			},500);
		}

		function highlightActiveTileRedAsWarning(active_tile_row_num, active_tile_column_num) {
			$("#game_board_tile_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"#CD2626"});
			$("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"#CD2626", borderRight: "2px solid #CD2626", borderBottom: "1px solid #CD2626", color: "#FFFFFF"});
			setTimeout(function() {
				$("#game_board_tile_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"#FFFFFF"});
				$("#game_board_piece_"+active_tile_row_num+"_"+active_tile_column_num).css({backgroundColor:"#FFFFFF", borderRight: "2px solid #FFFFFF", borderBottom: "1px solid #FFFFFF", color: "#7E7E7E"});
			},500);
		}

		function checkIfLevelCompleted(used_number_pieces_arr_for_current_level) {
			if($.inArray(0, used_number_pieces_arr_for_current_level) == -1) {
				// if level is complete
				$("#"+active_level_id).addClass("completed_level");
				$("#"+active_level_id).removeClass("incomplete_level");
				displayLevelCompletedMsgBox();
				setTimeout(function() {
					hideLevelCompletedMsgBox();
				}, 3000);
			} else {
				// if level is not complete, check if updates to assigned classes are required
				checkIfChangesWereMadeToACompletedLevel();
			}
		}

		function checkIfChangesWereMadeToACompletedLevel() {
			if($("#"+active_level_id).hasClass("completed_level")) {
				$("#"+active_level_id).addClass("incomplete_level");
				$("#"+active_level_id).removeClass("completed_level");
			}
		}

		function displayLevelCompletedMsgBox() {
			$("#level_completed_msgbox_wrapper").css({display: "block"});
			$("#level_completed_msgbox_wrapper").animate({opacity: "1"});
		}

		function hideLevelCompletedMsgBox() {
			$("#level_completed_msgbox_wrapper").animate({opacity: "0"});
			setTimeout(function() {
				$("#level_completed_msgbox_wrapper").css({display: "none"});
			}, 1000);
		}

		var public_objects =
		{
			determineAndExecutePlayerSelection : determineAndExecutePlayerSelection,
			removeDoubleClickedUsedGamePiece : removeDoubleClickedUsedGamePiece,
			findDraggedUnusedNumberPiece : findDraggedUnusedNumberPiece
		};

		return public_objects;
	}();

	function isLocalStorageEnabled() {
	    try {
	        sessionStorage.setItem("test_key","test_value");
	        if (sessionStorage.getItem("test_key") == "test_value"){
	            return true;
	        }
	    } catch (e) {};
	    return false;
	}

	function arrayOnlyContainsNumbers(arr) {
		for(var i = 0; i < arr.length; i++) {
			if(!$.isNumeric(arr[i])) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Returns true if the screen size of the user's device is larger
	 * than a set threshold; false otherwise.
	 */
	function isNotAMobileDevice() {
		return (screen.width > MIN_SCREEN_WIDTH && screen.height > MIN_SCREEN_HEIGHT);
	}

	var public_objects =
	{
		init : init
	};

	return public_objects;
}();

	
$(document).ready(function() {
	VernonChuo.SudokuOnline.init.execute();
});