(function($, window, document) {
	var $doc = $(document),
		$win = $(window),
		$backgroundImage,
		$buttonProfile,
		$mapCanvas,
		$map,
		$markers,
		$gpsFile,
		$graph,
		$graphMeter,
		$graphNumber,
		$formField,
		$buttonCoordinates,
		isMobile,
		myLat,
		myLng,
		map,
		marker;

	//document ready functions
	$doc.on('ready', function(){
		$backgroundImage   = $('.background-image');
		$buttonProfile     = $('.button-profile');
		$details           = $('#details');
		$mapCanvas         = $('#map-canvas');
		$map               = $('#map');
		$markers           = $('#markers');
		$gpsFile           = $('#gps-file');
		$graph             = $('#graph');
		$graphNumber       = $('#graph-numbers').find('span');
		$graphMeter        = $('.graph-meter');
		$formField         = $('.gfield, .form-row');
		$buttonCoordinates = $('#button-coordinates');

		//blink fields
		if ( $formField.length ) {
			$formField.each(function(){
				var $this = $(this);

				if ( $this.find('input, textarea').val() ) {
					$this.find('.gfield_label, .form-label').addClass('hidden');
				}
			});

			$formField
				.on('focusin', 'input, textarea', function(){
					$(this).parent().siblings('label').addClass('hidden');
				})
				.on('focusout', 'input, textarea', function(){
					var $this = $(this);

					if ( $this.val() == '' ) {
						$this.parent().siblings('label').removeClass('hidden');
					}
				});
		}

		//form subtotal calculation
		$('.gfield-participants').on('keyup', 'input', function(){
			var $subtotal = $('#booking-subtotal'),
				price     = parseInt($(this).val()),
				quantity  = parseInt($('#booking-price').text()),
				subtotal  = price*quantity;

			if ( price === parseInt(price) && price ) {
				$subtotal.text( subtotal + 'лв' );
			} else {
				$subtotal.text('');
			}
		});

		//header buttons
		$buttonProfile.children('a').on('click', function(e){
			$(this).parent().toggleClass('open').siblings().removeClass('open');

			e.preventDefault();
		});

		$doc.on('click', function(e){
			var $target = $(e.target);

			if ( !$target.parents('.button-profile').length ) {
				$buttonProfile.removeClass('open');
			}
		});

		$('#language-btn').on('click', function(e){
			$(this).parent().toggleClass('open');

			e.preventDefault();
		});

		//ratings
		$('.rating').each(function(){
			var $this    = $(this),
				readOnly = $this.data('readonly'),
				hints    = $this.data('hints'),
				score    = $this.data('score');

				$this.raty({
					path: 'css/images',
					starType: 'small',
					readOnly: readOnly,
					hints: hints,
					score: score
				});
		});

		//ie8 clears
		if ( $('.points').length && $('.lt-ie9').length ) {
			var $points = $('.points');
			
			if ( $('.content').length ) {
				$points.find('li:nth-child(2n+1)').addClass('cl');
			} else {
				$points.find('li:nth-child(4n+1)').addClass('cl');
			}
		}

		//inits
		$('.gallery-popup').magnificPopup({
			type: 'image',
			delegate: 'a',
			gallery: {
				enabled: true
			}
		});

		$('.slider').flexslider({
			directionNav: false
		});

		//infinite scroll
		$('.button-load').on('click', function(e){
			loadNextPage( $(this) );

			e.preventDefault();
		});

		//buttons functions
		$('#button-download').on('click', function(e){
			window.location = $(this).attr('href');

			e.preventDefault();
		});

		$('#button-print').on('click', function(e){
			window.print();

			e.preventDefault();
		});

		$('#button-navigate').on('click', function(e){
			/*alert( $(this).data('alert') );*/

			getGeolocation();

			e.preventDefault();
		});

		if ( $buttonCoordinates.length ) {
			getGeolocation();
		}

		$buttonCoordinates.on('click', function(e){
			marker.setMap(null);
			getGeolocation();

			e.preventDefault();
		});

		//other functions
		if ( $('.map-canvas').length ) {
			initialize();
		}

		$('select').selecter();

		mapSize();

		backgroundResize();
	});

	//window load functions
	$win.on('load', function(){

	});

	//window resize functions
	$win.on('resize', function(){
		backgroundResize();
		mapSize();
	});
	
	function getGeolocation(){
		if (navigator.geolocation && $buttonCoordinates.length) {
			navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
		} else if (navigator.geolocation && $('#button-navigate').length) {
			alert( 'is locationg' );
			navigator.geolocation.getCurrentPosition(geoNavigate, geoError);
		} else { 
			alert( 'is not locating ')
			$('.my-coordinates').html('<p>Вашият браузър не поддържа тази функция')
		}
	}

	function geoSuccess(position) {
		var $marker = $markers.find('a');
		
		myLat = position.coords.latitude;
		myLng = position.coords.longitude;

		$('#get-lat').text(myLat);
		$('#get-lng').text(myLng);
		$marker.data('lat', myLat);
		$marker.data('lng', myLng);

		singleMarker();
	}

	function geoNavigate(position) {
		myLat = position.coords.latitude;
		myLng = position.coords.longitude;

		alert( 'success ');
		window.location.href = 'http://maps.google.com/maps?saddr=' + myLat + ',' + myLng + '&daddr=41.4375720,23.5060176';
	}

	function geoError(){
		alert( 'error' );

		switch(error.code) {
			case error.PERMISSION_DENIED:
				alert( 'Denied ')
				$('.my-coordinates').html('<p>User denied the request for Geolocation.</p>');
				break;
			case error.POSITION_UNAVAILABLE:
				alert( 'unav ')
				$('.my-coordinates').html('<p>Location information is unavailable.</p>');
				break;
			case error.TIMEOUT:
				alert( 'timeout ')
				$('.my-coordinates').html('<p>The request to get user location timed out.</p>');
				break;
			case error.UNKNOWN_ERROR:
				alert( 'error ')
				$('.my-coordinates').html('<p>An unknown error occurred.</p>');
				break;
			default:
				alert( 'error' );
		}
	}

	function loadNextPage( $loadButton ){
		var	container   = $loadButton.data('container'),
			element     = $loadButton.data('element'),
			lastelement = $loadButton.parents(container).find(element + ':last'),
			endMessage  = $loadButton.parents(container).find('.end-message'),
			url         = $loadButton.attr('href');

		if ( url == undefined ){
			return false;
		}

		$.ajax({
			url: url,
			success: function( data ){
				var newEntries = $(element, data),
				    linkToNext = $('.button-load', data);

				newEntries.css('opacity', 0).insertAfter(lastelement).animate({ opacity: 1 });

				if( linkToNext.length ){
					$loadButton.attr( 'href', linkToNext.attr('href') );
				} else {
					$loadButton.remove();
					endMessage.show();
					setTimeout(function(){
						endMessage.addClass('hidden');
					}, 5000);
				}

				setTimeout(function() {
					locked = false;
				}, 100);
			},
			error: function(){
				alert('Page can not be loaded !');
			}
		});
	}

	function mapSize(){
		if ( $details.length && $map.length ) {
			$map.height($details.height());
			
			if ( $('.lt-ie9').length ) {
				$map.width($map.parents('.details').width() - $map.siblings('.list-table').outerWidth(true));
			}
		}
	}

	function backgroundResize(){
		$backgroundImage.each(function(){
			var $this = $(this);
			fullScreen( $this, $this.parents('.background') );
		});
	}

	function fullScreen( $image, $imgContainer ){
		var containerW = $imgContainer.width(),
			containerH = $imgContainer.height(),
			image      = $image,
			imageW     = parseInt(image.attr('width'), 10),
			imageH     = parseInt(image.attr('height'), 10),
			cRatio     = containerH/containerW,
			iRatio     = imageH/imageW;
	
		if (iRatio < cRatio) {
			image.css({
				'width': containerH/iRatio,
				'height': containerH
			});
		} else {
			image.css({
				'width': containerW,
				'height': containerW * iRatio
			});
		}
		
		image.css({
			'top': (containerH - image.height())/2,
			'left': (containerW - image.width())/2
		});
	}

	function initialize(){
		var mapOptions = {
			zoom: 13,
			mapTypeId: google.maps.MapTypeId.TERRAIN
		}
	
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

		if ( $buttonCoordinates.length ) {
			return
		} else if ( $markers.length ) {
			$markers.find('a').length > 1 ? multipleMarkers() : singleMarker();
		} else if ( $gpsFile.length ) {
			gpsParse();
		}

		var weatherLayer = new google.maps.weather.WeatherLayer({
			temperatureUnits: google.maps.weather.TemperatureUnit.CELSIUM
		});
		weatherLayer.setMap(map);
	}

	function gpsParse(){
		$.ajax({
			url: $gpsFile.attr('href'),
			dataType: 'xml',
			success: function( data ){
				var $trkseg          = $('trkseg', data),
					$trkpt           = $('trkpt', data),
					trkpts           = $trkpt.length,
					trksegCount      = 0,
					//map options variables
					bounds           = new google.maps.LatLngBounds(),
					newPath          = [],
					polylines        = [],
					//graph numbers variables
					numbersCount     = $graphNumber.length,
					pointBrakeHeight = [],
					//graph lines variables
					trakpsStep       = trkpts/$graph.data('lines'),
					trakpsLineCount  = trakpsStep,
					lineValues       = [],
					i                = 0,
					boundItem,
					lowestPoint,
					highestPoint;

				$trkseg.each(function(){
					newPath[trksegCount] = [];

					$(this).find('trkpt').each(function(){
						var $this = $(this),
							lat   = $this.attr('lat'),
							lng   = $this.attr('lon'),
							ele   = parseInt($this.find('ele').text());
							point = new google.maps.LatLng(lat, lng);

							if ( !lowestPoint ) {
								lowestPoint = ele;
							} else if ( lowestPoint > ele ) {
								lowestPoint = ele
							}

							if ( !highestPoint ) {
								highestPoint = ele;
							} else if ( highestPoint < ele ) {
								highestPoint = ele
							}

						if ( i == Math.floor(trakpsLineCount) && $graphNumber.length ) {
							lineValues.push(ele);
							trakpsLineCount += trakpsStep;
						}

						bounds.extend(point);
						newPath[trksegCount].push(point);

						i++;
					});

					//create polyline
						polylines = new google.maps.Polyline({
						path: newPath[trksegCount],
						strokeColor: '#FF0000',
						strokeWeight: 3
					});

					polylines.setMap(map);

					trksegCount++;
				});


				//graph numbers
				var	pointBrake = highestPoint,
					pointsDiff = highestPoint - lowestPoint,
					pointDiff  = pointsDiff/numbersCount;

				for ( var i = 0; i < numbersCount; i++ ) {
					pointBrakeHeight.push(pointBrake);
					pointBrake -= pointDiff;
				}

				if ( $graphNumber.length ) {
					$graphNumber.each(function(){
						var $this = $(this),
							text  = Math.floor(pointBrakeHeight[$this.index()]);

						$this.find('strong').text(text);
					});
				}

				//graph lines
				var graphMeterIndex = 0;

				$graphMeter.each(function(){
					var graphMeterHeight = (lineValues[graphMeterIndex] - lowestPoint)/pointsDiff*100;
					$(this).height(graphMeterHeight + '%');

					graphMeterIndex++;
				});

				//map fit bounds
				map.fitBounds(bounds);
			}
		});
	}

	function singleMarker(){
		var $marker  = $markers.find('a'),
			lat      = $marker.data('lat'),
			lng      = $marker.data('lng'),
			text     = $marker.data('text'),
			icon     = $marker.data('icon'),
			title    = $marker.data('title'),
			link     = $marker.attr('href'),
			linkText = $marker.text();
			point    = new google.maps.LatLng(lat, lng);

		map.setCenter( point );

		marker = new google.maps.Marker({
			map: map,
			icon: icon,
			position: point
		});

		var	infoWindow = new google.maps.InfoWindow({
			content: '<div class="infowindow"><h6>' + title + '</h6> <p class="infowindow-coordinates">' + lat + ', ' + lng + '</p> <p>' + text + '</p> <a href="' + link + '" target="_blank">' + linkText + '</a> </div>'
		});
	
		google.maps.event.addListener(marker, 'click', function() {
			infoWindow.open(map, this);
		});
	}

	function multipleMarkers(){
		var $marker     = $markers.find('a'),
			markers     = [],
			infoWindows = [],
			current     = 0,
			i           = 0,
			bounds      = new google.maps.LatLngBounds();

		$markers.find('a').each(function(){
			var $this = $(this),
				lat      = $this.data('lat'),
				lng      = $this.data('lng'),
				text     = $this.data('text'),
				icon     = $this.data('icon'),
				title    = $this.data('title'),
				link     = $this.attr('href'),
				linkText = $this.text();
				point    = new google.maps.LatLng(lat, lng);
	
			markers[i] = new google.maps.Marker({
				map: map,
				icon: icon,
				position: point
			});
	
			infoWindows[i] = new google.maps.InfoWindow({
				content: '<div class="infowindow"><h6>' + title + '</h6> <p>' + text + '</p> <a href="' + link + '" target="_blank">' + linkText + '</a> </div>'
			});
	
			google.maps.event.addListener(markers[i], 'click', function() {
				infoWindows[current].close();
				current = markers.indexOf(this);
				infoWindows[current].open(map, this);
			});

			bounds.extend(point);
	
			i++
		});

		//map fit bounds
		map.fitBounds(bounds);
	}
}(jQuery, window, document));