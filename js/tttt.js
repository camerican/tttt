$(document).ready(function() {
	/** 
	 * Swap a Player's symbol out for a new symbol
	 *
	 * @param newSymbol The symbol to swap in
	 * @param oldSymbol The symbol to swap out
	 * @param player The ID of the player to apply this change for (1/2)
	 * @return true on success, false on error
	 **/
	var swapSymbol = function( newSymbol, oldSymbol, player ) {
		if( newSymbol == p1S || newSymbol == p2S ) 		//safety-check; don't swap if symbol in use
			return false;	

		//swap out each occurance of old symbol in the grid and replace it with new symbol
		$('#board #grid div i.fa-'+symbol[oldSymbol]).removeClass('fa-'+symbol[oldSymbol]).addClass('fa-'+symbol[newSymbol]);

		//swap out new symbol from the symbol selection menus and swap in old symbol
		$('.symbol_selection i.fa-'+symbol[newSymbol]).removeClass('fa-'+symbol[newSymbol]).addClass('fa-'+symbol[oldSymbol]).attr('data-id',oldSymbol);
		
		if( player == 1 ) {								//save new symbol ID
			p1S = newSymbol;
		} else {
			p2S = newSymbol;
		}
		return true;									//success
	}

	/** 
	 * Cause a DOM element to pulsate
	 *
	 * @param obj The jQuery DOM object to pulsate
	 * @param lim The optional number of times to pulsate (Default is 3)
	 **/
	var pulsate = function(obj,lim) {
		lim = typeof lim !== 'undefined' ? lim : 3;
		for(var x=0;x<lim;x++) {
			obj.animate({opacity: 0.2}, 1000, 'linear')
			 .animate({opacity: 1}, 1000, 'linear');
		}
	}

	/** 
	 * Reset the Game Grid to Default State
	 **/
	var resetGrid = function() {
		grid = [ [ 0, 0, 0 ], [0, 0, 0], [0, 0, 0] ];	//this references global grid variable
		move = 0;
		over = false;

		//show move indicator
		if( currentPlayer == 1) {
			pulsate($('#left .possession').removeClass('hidden').attr('opacity',1));
		} else {
			pulsate($('#right .possession').removeClass('hidden').attr('opacity',1));
		}
		$('#board #grid div').removeClass('white').html('');	//reset grid coloration
		$('#reset').addClass('hidden');	//hide reset button for now
		$('console').html('');	//reset console
	}

	/** 
	 * Determine if there is a Game Winner by consulting gridSums
	 *
	 * @return true if winner is found, false otherwise
	 **/
	var checkWin = function() {

		//by multiplying each sum item by 2^pos, we resolve ambiuities
		var gridSums = [ 
			grid[0][0] + 2*grid[0][1] + 4*grid[0][2],
			grid[1][0] + 2*grid[1][1] + 4*grid[1][2],
			grid[2][0] + 2*grid[2][1] + 4*grid[2][2],
			grid[0][0] + 2*grid[1][0] + 4*grid[2][0],
			grid[0][1] + 2*grid[1][1] + 4*grid[2][1],
			grid[0][2] + 2*grid[1][2] + 4*grid[2][2],
			grid[0][0] + 2*grid[1][1] + 4*grid[2][2],
			grid[0][2] + 2*grid[1][1] + 4*grid[2][0]
		];

		var tmp, victor;

		//if Player 1 has won (detected if a gridSum equals 7)
		if( (tmp = gridSums.indexOf(7)) >= 0 && tmp >= 0 ) {
			victor = 1;
		//if Player 2 has won (detected if a gridSum equals 14)
		} else if ( (tmp = gridSums.indexOf(14)) >= 0 && tmp >= 0 )	{
			victor = 2;
		//if neither player has won
		} else {
			return false;
		}
		//console.log( 'call announceWinner('+victor+', '+tmp+')' );
		announceWinner( victor, tmp );
		return true;
	}

	/** 
	 * Announce the winner of the game to the user
	 *
	 * @param player The ID of the player who has won
	 * @param line The ID of the winning line
	 **/
	var announceWinner = function( player, line ) {
		var style;
		over = true;								//flag game as over

		if( line < 3 ) 		style = "horizonal";	//note winning move type
		else if( line < 5 ) style = "vertical";
		else				style = "diagonal";

													//announce victory to console
		$('#console').html("Player "+player+ " has won "+style+ "ly!");

		drawLine(line);								//draw the winning line on the grid
			
		if(player==1) {								//increment wins
			$('#left .score span').html(1+parseInt($('#left .score span').html()));
		} else {
			$('#right .score span').html(1+parseInt($('#right .score span').html()));
		}

		$('#reset').removeClass('hidden');			//show reset button
		hidePossessionArrow();
	}

	/** 
	 * Announce the game has been tied
	 **/
	var announceDraw = function( ) {
		$('#console').html('Oh no! It\'s a tie!');
		$('#grid div').each( function(index){
			$(this).delay(150*index).queue(function(next) {
				$(this).addClass('white');
				next();
			});
		});

		$('#reset').removeClass('hidden');			//show reset button
		hidePossessionArrow();
	}
	/** 
	 * Hide the Possession Arrows of specified player
	 *
	 * @param player The player whose posession arrow to hide (Default is 0 for both)
	 **/
	var hidePossessionArrow = function( player ) {
		player = typeof player !== 'undefined' ? player : 0;
		if( player <= 1 )
			$('#left .possession').addClass('hidden').show();
		if( player != 1 )
			$('#right .possession').addClass('hidden').show();
	}
	/** 
	 * Handle a player's move
	 *
	 * @param player The player who is moving
	 * @param row The row ID of the square being moved to
	 * @param col The column ID of the square being moved to
	 **/
	var makeMove = function( player, row, col ) {
		//console.log( "makeMove("+player+', '+row+', '+col+')' );
		if( grid[row][col] != 0 ) return -1;	//error check, this square cannot be marked
		
		var locSym;
		if( player == 1 ) locSym = p1S;			//note symbol to use for move
		else if( player == 2 ) locSym = p2S;
												//mark square
		$('#s_'+row+'_'+col).html('<i class="p'+player+' fa fa-'+symbol[locSym]+'"></i>');

		grid[row][col] = player;				//update grid

		move++;									//increment move counter

		//toggleTurn in either case (loser starts or next person's turn)
		toggleTurn(player);

		var chkwin = checkWin();				//check winner
		//console.log( "Win? "+chkwin + ' ... move #'+move);
		if( !chkwin && move >= 9 ) 				//if no winner & last move
			 announceDraw();					//announce game as a tie

	}

	/** 
	 * Toggle between player's turns
	 *
	 * @param player The player whose turn it now is (switch to other player's turn)
	 **/
	var toggleTurn = function(player) {
		if( over ) {
			$('#left .possession').addClass('hidden').show();
			$('#right .possession').addClass('hidden').show();
		} else if( player == 1 ) {
			currentPlayer = 2;
			pulsate($('#right .possession').removeClass('hidden').attr('opacity',1));
			$('#left .possession').stop(true,true).fadeOut({
				complete: function(){
					$(this).addClass('hidden').show();
				}
			});
		} else {
			currentPlayer = 1;
			pulsate($('#left .possession').removeClass('hidden').attr('opacity',1));
			$('#right .possession').stop(true,true).fadeOut({
				complete: function(){
					$(this).addClass('hidden').show();
				}
			});
		} 

	}

	/** 
	 * Draw the winning line by fading out other boxes not on this line
	 *
	 * @param line The ID of the grid line that has one (as referenced from lines array)
	 **/
	var drawLine = function(line) {
		for(var x=0;x<3;x++){
			for(var y=0;y<3;y++) {
				var found = false;
				for( var i=0;i<3;i++) {
					if( lines[line][i][0] == x && 
						lines[line][i][1] == y ) {
						found=true;
					}
				}
				if( !found )					//if this square is not part of line, make white 
					$('#s_'+x+'_'+y).addClass('white');
			}
		}
	}

	//configure game's global variables
	var grid = [ [ 0, 0, 0 ], [0, 0, 0], [0, 0, 0] ];	//populate our grid
	var move = 0;										//track # moves in this game
	var over = false									//game over flag
	var lines = [										//map winning lines (3-square combos)
		[ [0,0], [0,1], [0,2] ],
		[ [1,0], [1,1], [1,2] ],
		[ [2,0], [2,1], [2,2] ],
		[ [0,0], [1,0], [2,0] ],
		[ [0,1], [1,1], [2,1] ],
		[ [0,2], [1,2], [2,2] ],
		[ [0,0], [1,1], [2,2] ],
		[ [0,2], [1,1], [2,0] ]
	];
	console.log( lines );
	var currentPlayer = 1;								//player who's move it is
	var p1S = 0;										//symbol ID for Player 1
	var p2S = 1;										//symbol ID for Player 2

	var symbol = [ "times", "circle-o", "cog", "university", "suitcase", "heart", "key", "flash", "bomb", "futbol-o", "tree" ];								//array of symbolID => symbols

	//Handle Click on Grid Squares
	$('#grid div:not(.clicked)').bind('click', function() {
		if( over || move > 8 ) return false;			//insta-return if game is already over
		var tmp = $(this).attr('id').split('_');		//parse square id

		if( tmp.length < 3 ) {							//if id is not in s_x_y format
			return false;								//error, id could not be loaded
		}
		var r = tmp[1];									//get row Id
		var c = tmp[2];									//get column Id

		if( grid[r][c] != 0 )							//square must have 0 value to be empty
			return false;								//if square is not empty, reset

		makeMove(currentPlayer,r,c);					//handle the move
	});

	//Handle Click on New Symbol selection
	$('.symbol_selection i').bind('click', function() {
		if($(this).parents('#right').length > 0) {		//determine which player to swap for
			swapSymbol( $(this).attr('data-id'), p2S, 2 );
		} else {
			swapSymbol( $(this).attr('data-id'), p1S, 1 );
		}
	});

	//Handle Click on Reset Button
	$('#reset').bind('click', function(){
		resetGrid();
	});

	//Indicate it's Player 1's move to start
	pulsate($('#left .possession'));

});