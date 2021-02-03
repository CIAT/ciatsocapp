/* This web application provides a platform where users can visualize the organic carbon content of a soil of their choice, 
as well as the quantitative impact of soil conserving management practices on sequestration, how such sequestration would unfold 
over time and what would be the magnitude of SOC sequestration if the anticipated practice (to foster SOC seq.) would be scaled 
out to countries, sub-continents or the entire world. The basis of the idea is the publication from Sommer and Bossio 
2014 (Dynamics and climate change mitigation potential of soil organic carbon sequestration. J. Environm. Management 144, 83-87).
* Author: CIAT
*/

function SocApp() {
	var data;
	var options;
	var nographovershoot = false;
	var nographnegatives = false;
	var activity1tablecomputations = [];
	var activity1graphcomputations = [];
	var activity2tablecomputations = [];
	var activity2graphcomputations = [];
	var activity3tablecomputations = [];
	var activity3graphcomputations = [];
	var addindex = 0;
	var showcomputations = false;
	var clickedcell;
	var totalacreageglobal;
	var totalyearsglobal = 60; // default values
	var minslidervalue_rateconst = 800; // default values
	var maxslidervalue_rateconst = 1000; // default values
	var rateconsfactor = 998; // default values
	var minslidervalue_yzero = 1000; // default values
	var maxslidervalue_yzero = 10000; // default values
	var perctotalareafactor = 1/totalyearsglobal * 100000;
	var graphactivity1height = 550;
	var graphactivity2height = 500;
	var graphactivity3height = 450;
	var area_year_soc_seq_total = 0.0;
	var serialized_faovaluedict = {};
	var serialized_constantsdict = {};
	var filepathfaodata = "faodata.json";
	var filepathconstantsdata = "stringconstants.json";
	var updatemaintablekey;
	var socconcheadingkey;
	var socseqheadingkey;
	var socseqovertimeheadingkey;
	var soctotalseqsummaryheadingkey;
	var selectoptionskey;
	var faostatlinkkey;
	var rateconstanttotalareakey;
	var decplaces = 12;


	$(document).ready(function() {
		$('#btnaddrow').tooltip();
		$('#btncomputeactivity').tooltip();
		$('#btnprinttotalseq').tooltip();
		
		addtablerow(5);

		$('#tblactivity1').on('click', 'input[type="image"]', function(e){
			$(this).closest('tr').remove();
			if (addindex > 0) {
				addindex-=1;
			}
			
			repositionfooter();
		});

		// fetch FAO json data
		$.getJSON(filepathfaodata, {
			format: "json"
		})
		.done(function(data) {
			serialized_faovaluedict = data;
			var obj = serialized_faovaluedict;
			
			// locality
			$('#cmblocality').find('option').remove();
			$('#cmblocality').append($('<option>', {
				value: "",
				text : "Select or Input Locality"
			}));
			for(var key in obj){
				if (obj.hasOwnProperty(key)){
					$('#cmblocality').append($('<option>', { 
						value: key,
						text : key
					}));
				}
			}
			
			$('#cmblanduse').find('option').remove();
			$('#cmblanduse').append($('<option>', {
				value: "",
				text : "Input Land Use"
			}));
		})
		.fail(function(jqxhr, textStatus, error) {
			messiprompt(textStatus + ", " + error, "Request Failed", "messierror");
			return;
		});

		// fetch json data
		$.getJSON(filepathconstantsdata, {
			format: "json"
		})
		.done(function(data) {
			serialized_constantsdict = data;
			selectoptionskey = serialized_constantsdict["selectoptionskey"];
			updatemaintablekey = serialized_constantsdict["updatemaintablekey"];
			socconcheadingkey = serialized_constantsdict["socconcheadingkey"];
			socseqheadingkey = serialized_constantsdict["socseqheadingkey"];
			socseqovertimeheadingkey = serialized_constantsdict["socseqovertimeheadingkey"];
			soctotalseqsummaryheadingkey = serialized_constantsdict["soctotalseqsummaryheadingkey"];
			faostatlinkkey = serialized_constantsdict["faostatlinkkey"];
			rateconstanttotalareakey = serialized_constantsdict["rateconstanttotalareakey"];
			
			$('#hselectoptions').text(selectoptionskey);
			$('#hupdatemaintable').text(updatemaintablekey);
			$('#asocconcheading').text(socconcheadingkey);
			$('#asocseqheading').text(socseqheadingkey);
			$('#asocseqovertimeheading').text(socseqovertimeheadingkey);
			$('#asoctotalseqsummaryheading').text(soctotalseqsummaryheadingkey);
			$('#hfaostatlink').attr("href", faostatlinkkey);
		})
		.fail(function(jqxhr, textStatus, error) {
			messiprompt(textStatus + ", " + error, "Request Failed", "messierror");
			return;
		});

		$('#cmblocality').on('change', function() {
			if ($(this).val()) {
				$('#txtacreage').val(fetchacreage($(this).val()));
				$('#txtlocality').val($(this).val());
				$('#txtlocality').prop('readonly', true);
				$('#divlocality').css({"display": "none"});
				
			} else {
				$('#txtacreage').val("");
				$('#txtlocality').val("");
				$('#txtlocality').prop('readonly', false);
				$('#divlocality').css({"display": "inline-block"});
			}
			
			fetchlanduse($(this).val());
		});

		$('#cmblanduse').on('change', function() {
			if ($('#cmblocality').val() && $(this).val()) {
				$('#txtacreage').val(fetchacreage($('#cmblocality').val()));
			} else {
				$('#txtacreage').val("");
			}
			
			if ($(this).val()) {
				$('#txtlanduse').val($("#cmblanduse option:selected").text());
				$('#txtlanduse').prop('readonly', true);
				$('#divlanduse').css({"display": "none"});
			} else {
				$('#txtlanduse').val("");
				$('#txtlanduse').prop('readonly', false);
				$('#divlanduse').css({"display": "inline-block"});
			}
		});

		$('#btnprinttotalseq').on('click', function(){
			var pageTitle = 'Total Sequestration';
			var stylesheet = 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css';
			var win = window.open('', 'Print Total Sequestration');
			
			win.document.write('<html><head><title>' + pageTitle + '</title>' +
				'<link rel="stylesheet" href="' + stylesheet + '">' +
				'</head><body>' + $('#tbltotalsocsequestration')[0].outerHTML + '</body></html>');
			win.document.close();
			win.print();
			win.close();
			return false;
		});	
	});
	
	window.onload = function() {
		if (!window.Highcharts || !window.jQuery) {  
			messiprompt("Your internet connection is not reliable. Computations not possible.", "Internet Connection", "messierror");
			return;
		}
	}

	
	this.addtablerowclick = function() {
		try {
			// if input is numeric
			if (!$.isNumeric($('#txtaddrow').val())) {
				$('#txtaddrow').css({ "border": "solid 2px #FF0000" });
				return;
			}
			
			$('#txtaddrow').css({ "border": "solid 1px #dddddd" });
			addtablerow(parseInt($('#txtaddrow').val()));
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}
	
	
	this.displayactivityvalues = function() {
		try {
			if (!$('#txtlocality').val()) {
				$('#txtlocality').css({ "border": "solid 2px #FF0000" });
				return;
			}
			$('#txtlocality').css({ "border": "solid 1px #dddddd" });
			
			if (!$('#txtlanduse').val()) {
				$('#txtlanduse').css({ "border": "solid 2px #FF0000" });
				return;
			}
			$('#txtlanduse').css({ "border": "solid 1px #dddddd" });
			
			if (!$.isNumeric($('#txtacreage').val())) {
				$('#txtacreage').css({ "border": "solid 2px #FF0000" });
				return;
			}
			$('#txtacreage').css({ "border": "solid 1px #dddddd" });
			totalacreageglobal = parseFloat($('#txtacreage').val())/1000000.0;
			
			if ($('#checkcomps').is(':checked')) {
				showcomputations = true;
			} else {
				showcomputations = false;
			}
			
			if (tablevaluesvalid($("#tblactivity1")) == true) {
				$('#divactivity1computedtable').empty();
				$('#divactivity2computedtable').empty();
				$('#divactivity3computedtable').empty();
				
				$('#divactivity1computedtable').css({"display": "none"});
				$('#divactivity2computedtable').css({"display": "none"});
				$('#divactivity3computedtable').css({"display": "none"});
				
				$('#divactivity1graphtable').empty();
				$('#divactivity2graphtable').empty();
				$('#divactivity3graphtable').empty();
				
				$('#divactivity1graphtable').css({"display": "none"});
				$('#divactivity2graphtable').css({"display": "none"});
				$('#divactivity3graphtable').css({"display": "none"});
				
				$('#ct-chartactivity1').empty();
				$('#ct-chartactivity2').empty();
				$('#ct-chartactivity3').empty();
				
				$('#ct-chartactivity1').css({"display": "none"});
				$('#ct-chartactivity2').css({"display": "none"});
				$('#ct-chartactivity3').css({"display": "none"});
				
				displayactivityonevalues();
			}
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}
	
	
	this.checkgraphovershootchange = function() {
		try {
			if ($('#checkgraphovershoot').is(':checked')) {
				nographovershoot = true;
			} else {
				nographovershoot = false;
			}
			
			// compute graph values
			computeactivity2graphvalues();
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}
	
	
	this.checkgraphnegativeschange = function() {
		try {
			if ($('#checkgraphnegatives').is(':checked')) {
				nographnegatives = true;
			} else {
				nographnegatives = false;
			}
		
			// compute graph values
			computeactivity2graphvalues();
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}
	

	


	function fetchacreage(selectedlocality) {
		try {
			var sellanduse = $("#cmblanduse option:selected").text();
			if (sellanduse) {
				return serialized_faovaluedict[selectedlocality][sellanduse];
			
			} else {
				return "";
			}
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
			return "";
		}
	}


	function fetchlanduse(selectedlocality) {
		var txtlanduse;

		try {
			if ($('#cmblocality').val()) {
				txtlanduse = "Select or Input Land Use";
			} else {
				txtlanduse = "Input Land Use";
			}
			
			$('#cmblanduse').find('option').remove();
			$('#cmblanduse').append($('<option>', {
				value: "",
				text : txtlanduse
			}));
			
			if (selectedlocality) {
				var obj = serialized_faovaluedict[selectedlocality]
				
				for(var key in obj){
					if (obj.hasOwnProperty(key)){
						$('#cmblanduse').append($('<option>', { 
							value: key,
							text : key
						}));
					}
				}
			}
			
			$('#txtlanduse').val("");
			$('#txtlanduse').prop('readonly', false);
			$('#divlanduse').css({"display": "inline-block"});
			$('#txtacreage').val("");
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}

	
	function addtablerow(noofrows) {
		var layer;
		var thicknessval;
		var socstartval;
		var socendval;
		var bulkdensityval;

		try {
			for (i = 0; i < noofrows; i++) {
				switch(addindex) {
					case 0:
						thicknessval = 6;
						socstartval = 35;
						socendval = 45;
						bulkdensityval = 1.2;
						break;
					case 1:
						thicknessval = 22;
						socstartval = 30;
						socendval = 35;
						bulkdensityval = 1.25;
						break;
					case 2:
						thicknessval = 34;
						socstartval = 15;
						socendval = 20;
						bulkdensityval = 1.3;
						break;
					case 3:
						thicknessval = 40;
						socstartval = 10;
						socendval = 10;
						bulkdensityval = 1.35;
						break;
					case 4:
						thicknessval = 44;
						socstartval = 5;
						socendval = 5;
						bulkdensityval = 1.38;
						break;
					default:
						thicknessval = "??";
						socstartval = "??";
						socendval = "??";
						bulkdensityval = "??";
				}
				
				layer = $('#tblactivity1').find('tbody').find('tr').length + 1;
				
				$('#tblactivity1').find('tbody').append('<tr>' +
						'<td class="uneditvalues" contenteditable=false style="cursor:pointer;">' + layer + '</td>' +
						'<td class="editvaluesinitialinput" contenteditable=true title="Add Layers" style="cursor:pointer;" data-title="Enter Thickness">' + thicknessval + '</td>' +
						'<td class="editvaluesinitialinput" contenteditable=true title="Add Layers" style="cursor:pointer;" data-title="Enter SOC">' + socstartval + '</td>' +
						'<td class="editvaluesinitialinput" contenteditable=true style="cursor:pointer;" data-title="Enter SOC">' + socendval + '</td>' +
						'<td class="editvaluesinitialinput" contenteditable=true style="cursor:pointer;" data-title="Enter Bulk Density">' + bulkdensityval + '</td>' +
						'<td class="uneditvalues" contenteditable=false style="cursor:pointer;"></td>' +
						'<td style="align:center; padding:0px; margin:0px;"><input type="image" src="./img/delete.png" class="removerowbtn" title="Remove" height="24" data-toggle="tooltip" data-placement="right"/></td>' +
					'</tr>');

				addindex += 1;
			}
			
			//renderdatatable('tblactivity1', false);
			
			$('.removerowbtn').tooltip();
			$('#divactivity1table').css({"display": "inline-block"});
			
			$('.editvaluesinitialinput').editable({
				mode: "popup",
				validate: function(value) {
					if (!$.isNumeric($.trim(value))) {
						return "Enter numeric value";
					}
				}
			});
			
			$('.editvaluesinitialinput').on('hidden', function (e, params) {
				if (params == "save") {
					displayactivityvalues();
				}
			});
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function displayactivityonevalues() {
		try {
			$('#divactivity1computedtable').empty();
			
			// append computed values
			activity1tablecomputations = computeactivityonevalues();
			if (activity1tablecomputations) {
				// if display tables
				if (showcomputations == true) {
					$('#divactivity1computedtable').append('<p>Computed Values:</p>' +
					'<table id="tblactivity1computedvalues" class="table table-striped table-bordered table-condensed">');
					
					$('#tblactivity1computedvalues').append('<thead>' +
						'<th>Layer</th><th>Layer Thickness (cm)</th><th>Layer, top depth(cm)</th><th>Layer, bottom depth(cm)</th><th>Layer, mid depth(cm)</th><th>SOC conc. (g/kg) - START</th><th>SOC conc. (g/kg) - END</th><th>Delta SOC (g/kg)</th><th>Bulk density (g/cm3)</th><th>SOC-seq (Mg/ha/depth)</th>' +
					'</thead>' +
						
					'<tbody>' +
						
					'</tbody>');
				}
				
				for (i = 1; i < activity1tablecomputations.length - 2; i++) {
					var returnrows = activity1tablecomputations[i];
					document.getElementById('tblactivity1').rows[i].cells[5].innerHTML = formatNumber(returnrows[returnrows.length - 1], 1);
				}
				
				var totsocseq = activity1tablecomputations[activity1tablecomputations.length - 1][9];
				
				$("#tblactivity1").find('tfoot').remove();
				
				var foot = $('<tfoot>').appendTo("#tblactivity1");
				
				foot.append($('<td class="uneditvalues"><b>Total</b></td><td></td><td></td><td></td><td></td><td class="uneditvalues"><b>' + formatNumber(totsocseq, 1) + '</b></td><td></td>'));
				
				// if display tables
				if (showcomputations == true) {
					for (i = 0; i < activity1tablecomputations.length; i++) {
						var returnrows = activity1tablecomputations[i];
						
						$('#tblactivity1computedvalues').find('tbody').append('<tr></tr>');
						
						for (j = 0; j < returnrows.length; j++) {
							if (j == returnrows.length - 1) {
								$('#tblactivity1computedvalues tr:last').append('<td>' + formatNumber(returnrows[j], 1) + '</td>');
							} else {
								$('#tblactivity1computedvalues tr:last').append('<td>' + returnrows[j] + '</td>');
							}
						}
					}
					
					$('#divactivity1computedtable').css({ "display": "inline-block" });
					renderdatatable('tblactivity1computedvalues', 'divactivity1computedtable', true);
				}
				
				// create graph values (for second table)
				activity1graphcomputations = computeactivityonegraphvalues(activity1tablecomputations);
				var labelsdata = [];
				var linesmoothenedstart = [];
				var linesmoothenedend = [];
				var markerliststart = []; // holds values to display with marker
				var markerlistend = []; // holds values to display with marker
				var middepthliststart = [];
				var middepthlistend = [];
				
				if (activity1graphcomputations) {
					// if display tables
					if (showcomputations == true) {
						$('#divactivity1graphtable').append('<table id="tblactivity1graphvalues" class="table table-striped table-bordered table-condensed">');
							
							$('#tblactivity1graphvalues').append('<thead>' +
								'<th>Depth(cm)</th><th>Line, smoothened - START</th><th>Line, smoothened - END</th>' +
							'</thead>' +
								
							'<tbody>' +
								
							'</tbody>');
					}
					
					for (k = 0; k < activity1graphcomputations.length; k++) {
						var returnrows = activity1graphcomputations[k];
						
						// if display tables
						if (showcomputations == true) {
							var item = '<tr>';
							
							for (l = 0; l < returnrows.length; l++) {
								if (l == 0) {
									item += '<td>' + returnrows[l] + '</td>';
								} else {
									item += '<td>' + formatNumber(returnrows[l], 2) + '</td>';
								}
							}
							
							item += '</tr>';
							$('#tblactivity1graphvalues').find('tbody').append(item);
						}
						
						labelsdata.push(parseFloat(returnrows[0]));
						linesmoothenedstart.push(parseFloat(returnrows[1]));
						linesmoothenedend.push(parseFloat(returnrows[2]));
					}
					
					if (showcomputations == true) {
						$('#divactivity1graphtable').css({ "display": "inline-block" });
						renderdatatable('tblactivity1graphvalues', 'divactivity1graphtable', true);
					}
					
					// get marker values
					//get lowest start to exclude initial repeated values
					var x_range = [];
					var y_start_range = [];
					var y_end_range = [];
					
					for (i = 0; i < activity1tablecomputations.length - 1; i++) {
						x_range.push(parseFloat(activity1tablecomputations[i][4]));
						y_start_range.push(parseFloat(activity1tablecomputations[i][5]));
						y_end_range.push(parseFloat(activity1tablecomputations[i][6]));
					}
					
					var beinningsameYstart = checkbeginningsameY(x_range, y_start_range);
					var beinningsameYend = checkbeginningsameY(x_range, y_end_range);
					
					var lastsameYstart = checklastsameY(x_range, y_start_range);
					var lastsameYend = checklastsameY(x_range, y_end_range);
					
					for (i = 0; i < activity1tablecomputations.length - 1; i++) {
						var returnrows = activity1tablecomputations[i];
						if (returnrows[4] >= beinningsameYstart[0] && returnrows[4] <= lastsameYstart[0]) {
							middepthliststart.push(parseFloat(returnrows[4]));
							markerliststart.push(parseFloat(returnrows[5]));
						}
						
						if (returnrows[4] >= beinningsameYend[0] && returnrows[4] <= lastsameYend[0]) {
							middepthlistend.push(parseFloat(returnrows[4]));
							markerlistend.push(parseFloat(returnrows[6]));
						}
					}
					
					// draw graph
					drawactivityonegraph(labelsdata, linesmoothenedstart, linesmoothenedend, markerliststart, markerlistend, middepthliststart, middepthlistend);
					
				} else {
					messiprompt("No values for graph display", "Graph", "messiwarning");
				}
				
			} else {
				messiprompt("Some values are not computed", "Values", "messiwarning");
			}
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function computeactivityonevalues() {
		var layer = 0;
		var layerthickness = "";
		var topdepth = "";
		var bottomdepth = "";
		var middepth = 0;
		var socstart = 0;
		var socend = 0;
		var deltasoc = "";
		var bulkdensity = "";
		var socseq = "";
		var sumlayerthickness = 0.0;
		var sumbulkdensity = 0.0;
		var sumsocseq = 0.0;
		var lastrowlist = [];
		var r = 0;
		var activityonecomputedlist = [];

		try {
			$('#tblactivity1 tbody').find('tr').each(function () {
				var rowlist = [];
				var selrow = $(this);
				
				if (r == 0){
					socstart = selrow.find('td').eq(2).html();
					socend = selrow.find('td').eq(3).html();
					rowlist = [layer, layerthickness, topdepth, bottomdepth, middepth, socstart, socend, deltasoc, bulkdensity, socseq];
					activityonecomputedlist.push(rowlist);
					
					rowlist = [];
					layer = r + 1;
					
					layerthickness = parseInt(selrow.find('td').eq(1).html());
					topdepth = 0;
					bottomdepth = layerthickness + topdepth;
					middepth = (topdepth + bottomdepth)/2;
					socstart = parseInt(selrow.find('td').eq(2).html());
					socend = parseInt(selrow.find('td').eq(3).html());
					deltasoc = (socend - socstart)
					bulkdensity = parseFloat(selrow.find('td').eq(4).html());
					
					// compute
					socseq = (parseFloat(selrow.find('td').eq(1).html()) * deltasoc * bulkdensity)/10.0;
					sumlayerthickness += parseInt(layerthickness);
					sumbulkdensity += parseFloat(layerthickness) * parseFloat(bulkdensity);
					sumsocseq += parseFloat(socseq);
					
					rowlist = [layer, layerthickness, topdepth, bottomdepth, middepth, socstart, socend, deltasoc, bulkdensity, socseq];
					activityonecomputedlist.push(rowlist);
					
				} else {
					layer = r + 1;
					layerthickness = parseInt(selrow.find('td').eq(1).html());
					topdepth = bottomdepth; // previous
					bottomdepth = layerthickness + topdepth;
					middepth = (topdepth + bottomdepth)/2;
					socstart = parseInt(selrow.find('td').eq(2).html());
					socend = parseInt(selrow.find('td').eq(3).html());
					deltasoc = (socend - socstart)
					bulkdensity = parseFloat(selrow.find('td').eq(4).html());
					
					// compute
					socseq = (parseFloat(selrow.find('td').eq(1).html()) * deltasoc * bulkdensity)/10.0;
					sumlayerthickness += parseInt(layerthickness);
					sumbulkdensity += parseFloat(layerthickness) * parseFloat(bulkdensity);
					sumsocseq += parseFloat(socseq);
					
					rowlist = [layer, layerthickness, topdepth, bottomdepth, middepth, socstart, socend, deltasoc, bulkdensity, socseq];
					activityonecomputedlist.push(rowlist);
				}
				
				r+=1;
				lastrowlist = rowlist;
				
				rowlist = [];
			});
			
			activityonecomputedlist.push(["Last", "", "", "", parseInt(lastrowlist[4]) + 5, lastrowlist[5], lastrowlist[6], "", "", ""]);
			activityonecomputedlist.push(["", "", "", "", "", "", "", "", sumbulkdensity/sumlayerthickness, sumsocseq]);
			
			return activityonecomputedlist;
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
			return activityonecomputedlist;
		}
	}


	function computeactivityonegraphvalues(graphlist) {
		var layerdepth_range = [];
		var socstart_range = [];
		var socend_range = [];
		var activityonecomputedgraphlist = [];
		var linesmoothenedstart = 0.0;
		var linesmoothenedend = 0.0;

		try {
			if (activity1tablecomputations) {
				for (i = 0; i < activity1tablecomputations.length - 1; i++) {
					layerdepth_range.push(parseFloat(activity1tablecomputations[i][4]));
					socstart_range.push(parseFloat(activity1tablecomputations[i][5]));
					socend_range.push(parseFloat(activity1tablecomputations[i][6]));
				}
				
				var highestdepth = parseFloat(graphlist[graphlist.length - 3][3]) + 5;
				
				var firstsameXstartvalue = checkbeginningsameY(layerdepth_range, socstart_range);
				var firstsameXendvalue = checkbeginningsameY(layerdepth_range, socend_range);
				
				var lastsameXstartvalue = checklastsameY(layerdepth_range, socstart_range);
				var lastsameXendvalue = checklastsameY(layerdepth_range, socend_range);
				
				for (depth = 0; depth < highestdepth; depth++) {
					if (depth < firstsameXstartvalue[0]) {
						linesmoothenedstart = firstsameXstartvalue[1];
						
					} else if (depth > lastsameXstartvalue[0]) {
						linesmoothenedstart = lastsameXstartvalue[1];
					
					} else {
						linesmoothenedstart = cubic_spline(layerdepth_range, socstart_range, parseFloat(depth), nographnegatives, nographovershoot);
					}
					
					if (depth < firstsameXendvalue[0]) {
						linesmoothenedend = firstsameXendvalue[1];
						
					} else if (depth > lastsameXendvalue[0]) {
						linesmoothenedend = lastsameXendvalue[1];
				
					} else {
						linesmoothenedend = cubic_spline(layerdepth_range, socend_range, parseFloat(depth), nographnegatives, nographovershoot);
					}
					
					rowlist = [depth, linesmoothenedstart, linesmoothenedend];
					activityonecomputedgraphlist.push(rowlist);
				}
			}
			
			return activityonecomputedgraphlist;
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
			return activityonecomputedgraphlist;
		}
	}


	function drawactivityonegraph(labelsdata, linesmoothenedstart, linesmoothenedend, markerliststart, markerlistend, middepthliststart, middepthlistend) {
		var lowest_linesmoothened = 0;

		try {
			var lowest_linesmoothenedstart = getlowestvalue(linesmoothenedstart);
			var lowest_linesmoothenedend = getlowestvalue(linesmoothenedend);
			
			if (lowest_linesmoothenedstart < lowest_linesmoothenedend) {
				lowest_linesmoothened = lowest_linesmoothenedstart;
			} else {
				lowest_linesmoothened = lowest_linesmoothenedend;
			}
			
			var chart = new Highcharts.Chart({
				chart: {
					renderTo: 'ct-chartactivity1',
					type: 'line',
					inverted: true
				},
				credits: {
					enabled: false
				},
				title: {
					text: 'SOC Concentration',
					x: -20 //center
				},
				xAxis: {
					title: {
						text: 'Depth (cm)'
					},
					categories: labelsdata,
					allowDecimals: false,
					gridLineColor: '#D8D8D8',
					gridLineWidth: 1
				},
				yAxis: {
					title: {
						text: 'SOC (g/kg)'
					},
					plotLines: [{
						value: 0,
						width: 1,
						color: '#808080'
					}],
					allowDecimals: false,
					opposite: true,
					gridLineColor: '#D8D8D8',
					gridLineWidth: 1,
					min: lowest_linesmoothened
				},
				plotOptions: {
					series: {
						marker: {
							enabled: false
						}
					}
				},
				tooltip: {
					valueSuffix: ' g/kg'
				},
				legend: {
					layout: 'horizontal',
					align: 'center',
					verticalAlign: 'bottom',
					borderWidth: 0
				},
				series: [{
					name: 'START (g/kg)',
					data: linesmoothenedstart
					
				}, {
					name: 'END (g/kg)',
					data: linesmoothenedend
				}]
			});
			
			var chartseries;
			var middepthpointstoadd;
			var markerpointstoadd;
			
			// update series 1 chart
			chartseries = chart.series[1];
			middepthpointstoadd = middepthlistend;
			markerpointstoadd = markerlistend;
			
			for (j = 0; j < chartseries.data.length; j++) {
				if (middepthlistend.indexOf(chartseries.data[j].x) >= 0 && markerlistend.indexOf(chartseries.data[j].y) >= 0) {
					chartseries.data[j].update({
						marker:{
							enabled: true,
							symbol: 'square',
							radius: 5.5,
							fillColor: 'white',
							lineColor: '#FF0000',
							lineWidth: 1,
							states: {
								allowPointSelect: true,
								hover: {
									fillColor: 'red',
									lineColor: 'red'                                	
								}
							}
						}
					});
					
					middepthpointstoadd.splice(middepthpointstoadd.indexOf(chartseries.data[j].x), 1);
					markerpointstoadd.splice(markerpointstoadd.indexOf(chartseries.data[j].y), 1);
				} 
			}
			
			if (middepthpointstoadd.length > 0) {
				var endpnt;
				
				for (j = 0; j < middepthpointstoadd.length; j++) {
					chartseries.addPoint({
						x: middepthpointstoadd[j],
						y: markerpointstoadd[j],
						marker:{
							enabled: true,
							symbol: 'square',
							radius: 5.5,
							fillColor: 'white',
							lineColor: '#FF0000',
							lineWidth: 1,
							states: {
								allowPointSelect: true,
								hover: {
									fillColor: 'red',
									lineColor: 'red'                                	
								}
							}
						}
					}, false);
				}
			}
			
			// update series 0 chart
			chartseries = chart.series[0];
			middepthpointstoadd = middepthliststart;
			markerpointstoadd = markerliststart;
			
			for (j = 0; j < chartseries.data.length; j++) {
				if (middepthliststart.indexOf(chartseries.data[j].x) >= 0 && markerliststart.indexOf(chartseries.data[j].y) >= 0) {
					chartseries.data[j].update({
						marker:{
							enabled: true,
							symbol: 'circle',
							radius: 7,
							fillColor: 'white',
							lineColor: '#000000',
							lineWidth: 1,
							states: {
								allowPointSelect: true,
								hover: {
									fillColor: '#000000',
									lineColor: '#000000'                                	
								}
							}
						}
					});
					
					middepthpointstoadd.splice(middepthpointstoadd.indexOf(chartseries.data[j].x), 1);
					markerpointstoadd.splice(markerpointstoadd.indexOf(chartseries.data[j].y), 1);
				}
			}
			
			if (middepthpointstoadd.length > 0) {
				var endpnt;
				
				for (j = 0; j < middepthpointstoadd.length; j++) {
					chartseries.addPoint({
						x: middepthpointstoadd[j],
						y: markerpointstoadd[j],
						marker:{
							enabled: true,
							symbol: 'circle',
							radius: 7,
							fillColor: 'white',
							lineColor: '#000000',
							lineWidth: 1,
							states: {
								allowPointSelect: true,
								hover: {
									fillColor: '#000000',
									lineColor: '#000000'                                	
								}
							}
						}
					});
				}
			}
			
			$('#ct-chartactivity1').css({ "height": graphactivity1height +"px" });
			$('#ct-chartactivity1').css({ "display": "inline-block" });
			$('#outerdiv').css({ "display": "inline-block" });
			//$('#ct-chartactivity1').highcharts().reflow();
			chart.setSize($(chart.container).parent().width() - 10, $(chart.container).parent().height() - 10);
			
			// activity 2 computations
			displayactivitytwovalues();
		}

		catch (err) {
			resizebodycontents();
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function displayactivitytwovalues() {
		try {
			$('#divactivity2computedtable').empty();
			activity2tablecomputations = [];
			
			var rowvalues = ["", "Year"];
			for (x = 1; x < $('#tblactivity1').find('tr').length; x++) {
				rowvalues.push("Layer " + x);
			}
			rowvalues.push("% Increase");
			
			activity2tablecomputations.push(rowvalues);
			
			var layerarray = [];
			var selrow;
			var layerrows = [];
			
			$('#tblactivity1 tbody').find('tr').each(function () {
				selrow = $(this);
				layerrows = [selrow.find('td').eq(2).html(), "", "", selrow.find('td').eq(3).html(), selrow.find('td').eq(4).html(), selrow.find('td').eq(1).html()];
				layerarray.push(layerrows);
			});
			
			rowvalues = ["START", 0];
			for (i = 0; i < layerarray.length; i++) {
				rowvalues.push(layerarray[i][0]);
			}
			rowvalues.push("");
			activity2tablecomputations.push(rowvalues); 
			
			rowvalues = ["", ""];
			for (i = 0; i < layerarray.length; i++) {
				rowvalues.push(layerarray[i][1]);
			}
			rowvalues.push("");
			activity2tablecomputations.push(rowvalues); 
			
			rowvalues = ["", ""];
			for (i = 0; i < layerarray.length; i++) {
				rowvalues.push(layerarray[i][2]);
			}
			rowvalues.push("");
			activity2tablecomputations.push(rowvalues);
			
			rowvalues = ["END", totalyearsglobal];
			for (i = 0; i < layerarray.length; i++) {
				rowvalues.push(layerarray[i][3]);
			}
			rowvalues.push("");
			activity2tablecomputations.push(rowvalues);
			
			rowvalues = ["BD (g/cm3)", ""];
			for (i = 0; i < layerarray.length; i++) {
				rowvalues.push(layerarray[i][4]);
			}
			rowvalues.push("");
			activity2tablecomputations.push(rowvalues);
			
			rowvalues = ["Thickness (cm)", ""];
			for (i = 0; i < layerarray.length; i++) {
				rowvalues.push(layerarray[i][5]);
			}
			rowvalues.push("");
			activity2tablecomputations.push(rowvalues);
			
			// update values
			if (activity2tablecomputations.length == 7) {
				var yearsupdated = updateactivity2yearcomputations();
				var valuesupdated = updateactivity2layercomputations();
				
				if (yearsupdated == false) {
					messiprompt("User input values are invalid", "Input Values", "messiwarning");
					return;
				}
				if (valuesupdated == false) {
					messiprompt("User input values are invalid", "Input Values", "messiwarning");
					return;
				}
				
			} else {
				messiprompt("Values failed to compute", "Values", "messierror");
				return;
			}
			
			// append computed values
			if (activity2tablecomputations) {
				for (i = 0; i < activity2tablecomputations.length; i++) {
					if (i == 0) {
						$('#divactivity2computedtable').append('<table id="tblactivity2computedvalues" class="table table-striped table-bordered table-condensed">');
						
						if (nographovershoot == true) {
							$('#checkgraphovershoot').prop('checked', true);
						}
						
						if (nographnegatives == true) {
							$('#checkgraphnegatives').prop('checked', true);
						}
						
						var headeritem = '<thead>';
						for (j = 0; j < activity2tablecomputations[i].length; j++) {
							headeritem+='<th>' + activity2tablecomputations[i][j] + '</th>';
						}
						headeritem+='</thead>' + '<tbody>' + '</tbody>';
						
						$('#tblactivity2computedvalues').append(headeritem);
						
					} else {
						var rowitem = '<tr>';
						
						for (k = 0; k < activity2tablecomputations[i].length; k++) {
							if (((i == 2 || i == 3 || i == 4) && k == 1) || ((i == 2 || i == 3) && k == 2)) {
								rowitem += '<td class="editvaluessocseq" contenteditable=true style="cursor:pointer;" data-title="Edit Value">' + activity2tablecomputations[i][k] + '</td>';
							} else {
								rowitem += '<td contenteditable=false class="uneditvalues">' + activity2tablecomputations[i][k] + '</td>';
							}
						}
						
						rowitem += '</tr>';
						$('#tblactivity2computedvalues').find('tbody').append(rowitem);
					}
				}
				
				//renderdatatable('tblactivity2computedvalues', true);
	
				$('.editvaluessocseq').editable({
					mode: "popup",
					validate: function(value) {
						if (!$.isNumeric($.trim(value))) {
							return "Enter numeric value";
						}
					}
				});
				
				$('.editvaluessocseq').on('hidden', function (e, params) {
					if (params == "save") {
						activity2tablevalueschanged(e.target);
					}
				});
				
				$('#divactivity2computedtable').css({ "display": "inline-block" });
				
				// compute graph values
				computeactivity2graphvalues();
				
			} else {
				messiprompt("Some values not computed", "Values", "messiwarning");
			}
		}

		catch (err) {
			resizebodycontents();
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function updateactivity2yearcomputations() {
		try {
			if (!$.isNumeric(activity2tablecomputations[4][1])) {
				return false;

			} else {
				totalyearsglobal = parseInt(activity2tablecomputations[4][1]);
				activity2tablecomputations[2][1] = totalyearsglobal/3;
				activity2tablecomputations[3][1] = totalyearsglobal * 2/3;
				return true;
			}
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
			return false;
		}
	}


	function updateactivity2layercomputations() {
		try {
			activity2tablecomputations[2][2] = parseFloat(activity2tablecomputations[1][2]) + (parseFloat(activity2tablecomputations[4][2]) - parseFloat(activity2tablecomputations[1][2])) * 0.6;
			activity2tablecomputations[3][2] = parseFloat(activity2tablecomputations[1][2]) + (parseFloat(activity2tablecomputations[4][2]) - parseFloat(activity2tablecomputations[1][2])) * 0.9;
			
			activity2tablecomputations[2][activity2tablecomputations[0].length - 1] = (parseFloat(activity2tablecomputations[2][2]) - parseFloat(activity2tablecomputations[1][2]))/(parseFloat(activity2tablecomputations[4][2]) - parseFloat(activity2tablecomputations[1][2])) * 100.0;
			activity2tablecomputations[3][activity2tablecomputations[0].length - 1] = (parseFloat(activity2tablecomputations[3][2]) - parseFloat(activity2tablecomputations[1][2]))/(parseFloat(activity2tablecomputations[4][2]) - parseFloat(activity2tablecomputations[1][2])) * 100.0;
			
			for (i = 3; i < activity2tablecomputations[0].length - 1; i++) {
				activity2tablecomputations[2][i] = parseFloat(activity2tablecomputations[1][i]) + (parseFloat(activity2tablecomputations[2][activity2tablecomputations[0].length - 1])/100.0) * (parseFloat(activity2tablecomputations[4][i]) - parseFloat(activity2tablecomputations[1][i]));
				activity2tablecomputations[3][i] = parseFloat(activity2tablecomputations[1][i]) + (parseFloat(activity2tablecomputations[3][activity2tablecomputations[0].length - 1])/100.0) * (parseFloat(activity2tablecomputations[4][i]) - parseFloat(activity2tablecomputations[1][i]));
			}
			
			return true;
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
			return false;
		}
	}


	function computeactivity2graphvalues() {
		try {
			$('#divactivity2graphtable').empty();
			activity2graphcomputations = [];
			totalyearsglobal = parseInt(activity2tablecomputations[4][1]);
			var rowvalues = ["Year"];
			
			for (i = 2; i < activity2tablecomputations[0].length - 1; i++) {
				rowvalues.push(activity2tablecomputations[0][i]);
			}
			
			for (i = 2; i < activity2tablecomputations[0].length - 1; i++) {
				rowvalues.push(activity2tablecomputations[0][i]);
			}
			rowvalues.push("All Layers");
			activity2graphcomputations.push(rowvalues);
			
			var yearrange = [parseFloat(activity2tablecomputations[1][1]), parseFloat(activity2tablecomputations[2][1]), parseFloat(activity2tablecomputations[3][1]), parseFloat(activity2tablecomputations[4][1])];
			
			for (i = 0; i <= totalyearsglobal; i++) {
				rowvalues = [i];
				var colval;
				
				for (j = 2; j < activity2tablecomputations[0].length - 1; j++) {
					var layerrange = [parseFloat(activity2tablecomputations[1][j]), parseFloat(activity2tablecomputations[2][j]), parseFloat(activity2tablecomputations[3][j]), parseFloat(activity2tablecomputations[4][j])];
					
					colval = cubic_spline(yearrange, layerrange, i, nographnegatives, nographovershoot);
					rowvalues.push(colval);
				}
				
				if (i == 0) {
					for (j = 2; j < activity2tablecomputations[0].length - 1; j++) {
						rowvalues.push("");
					}
					rowvalues.push("");
					
				} else {
					var colsum = 0.0;
					for (j = 2; j < activity2tablecomputations[0].length - 1; j++) {
						colval = SOC_Konv((parseFloat(rowvalues[j-1]) - parseFloat(activity2graphcomputations[activity2graphcomputations.length - 1][j-1]))/10.0, parseFloat(activity2tablecomputations[5][j]), parseFloat(activity2tablecomputations[6][j]));
						rowvalues.push(colval);
						colsum += colval;
					}
					rowvalues.push(colsum);
				}
				
				activity2graphcomputations.push(rowvalues);
			}
			
			if (showcomputations == true) {
				for (i = 0; i < activity2graphcomputations.length; i++) {
					if (i == 0) {
						$('#divactivity2graphtable').append('<p>Computed Graph Values:</p>' +
						'<table id="tblactivity2graphvalues" class="table table-striped table-bordered table-condensed">');
						
						var headeritem = '<thead>';
						for (j = 0; j < activity2graphcomputations[i].length; j++) {
							headeritem+='<th>' + activity2graphcomputations[i][j] + '</th>';
						}
						headeritem+='</thead>' + '<tbody>' + '</tbody>';
						
						$('#tblactivity2graphvalues').append(headeritem);
						
					} else {
						var rowitem = '<tr>';
						
						for (k = 0; k < activity2graphcomputations[i].length; k++) {
							if (k == 0) {
								rowitem += '<td>' + activity2graphcomputations[i][k] + '</td>';
							} else {
								rowitem += '<td>' + formatNumber(activity2graphcomputations[i][k], 2) + '</td>';
							}
						}
						
						rowitem += '</tr>';
						$('#tblactivity2graphvalues').find('tbody').append(rowitem);
					}
				}
				
				$('#divactivity2graphtable').css({ "display": "inline-block" });
				renderdatatable('tblactivity2graphvalues', 'divactivity2graphtable', true);
			}
			
			var yearslabel = [];
			var soclayer1values = [];
			var socseqlayer1values = [];
			var markerlistsock = [];
			
			for (n = 1; n < activity2graphcomputations.length; n++) {
				yearslabel.push(parseFloat(activity2graphcomputations[n][0]));
				
				if (nographnegatives == true) {
					if (parseFloat(activity2graphcomputations[n][1]) >= 0.0) {
						soclayer1values.push(parseFloat(activity2graphcomputations[n][1]));
					} else {
						soclayer1values.push(null);
					}
				} else {
					soclayer1values.push(parseFloat(activity2graphcomputations[n][1]));
				}
				
				if (n > 1) {
					if (nographnegatives == true) {
						if (activity2graphcomputations[n][activity2graphcomputations[0].length - 1] >= 0.0) {
							socseqlayer1values.push(parseFloat(activity2graphcomputations[n][activity2graphcomputations[0].length - 1]));
						} else {
							socseqlayer1values.push(null);
						}
					
					} else {
						socseqlayer1values.push(parseFloat(activity2graphcomputations[n][activity2graphcomputations[0].length - 1]));
					}
				
				} else {
					socseqlayer1values.push(null);
				}
			}
			
			for (j = 0; j < 4; j++) {
				markerlistsock.push(parseFloat(activity2tablecomputations[j+1][2]));
			}
			
			// draw graph
			drawactivitytwograph(yearslabel, soclayer1values, socseqlayer1values, markerlistsock);
		}

		catch (err) {
			resizebodycontents();
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function drawactivitytwograph(yearslabel, soclayer1values, socseqlayer1values, markerlistsock) {
		var lowestsoclayer1values = 0;
		var lowestsocseqlayer1values = 0;
			
		try {
			// check if negatives
			if (nographnegatives == false) {
				lowestsoclayer1values = getlowestvalue(soclayer1values);
				lowestsocseqlayer1values = getlowestvalue(socseqlayer1values)
			}
			
			var chart = new Highcharts.Chart({
				chart: {
					renderTo: 'ct-chartactivity2',
					type: 'line'
				},
				credits: {
					enabled: false
				},
				title: {
					text: 'SOC Sequestration Over Time',
					x: -20 //center
				},
				xAxis: {
					title: {
						text: 'Year'
					},
					categories: yearslabel,
					gridLineColor: '#D8D8D8',
					gridLineWidth: 1
				},
				yAxis: [{
					title: {
						text: 'SOC (g/kg)'
					},
					plotLines: [{
						value: 0,
						width: 1,
						color: '#808080'
					}],
					
					
					allowDecimals: false,
					opposite: false,
					gridLineColor: '#D8D8D8',
					gridLineWidth: 1,
					min: lowestsoclayer1values
				},{
					title: {
						text: 'SOC Seq. (t/ha)',
					},
					plotLines: [{
						value: 0,
						width: 1,
						color: '#808080'
					}],
					allowDecimals: true,
					opposite: true,
					gridLineColor: '#D8D8D8',
					gridLineWidth: 1,
					min: lowestsocseqlayer1values
				}],
				plotOptions: {
					series: {
						marker: {
							enabled: false
						}
					}
				},
				
				legend: {
					layout: 'horizontal',
					align: 'center',
					verticalAlign: 'bottom',
					borderWidth: 0
				},
				series: [{
					name: 'SOC (g/kg)',
					data: soclayer1values,
					yAxis: 0,
					tooltip: {
						valueSuffix: ' g/kg'
					}
				},{
					name: 'SOC Seq. (t/ha))',
					data: socseqlayer1values,
					yAxis: 1,
					tooltip: {
						valueSuffix: ' (t/ha)'
					}
				}]
			});
			
			// update color
			chart.yAxis[0].update({
				title: {
					style: {
						color: chart.series[0].color
					}
				},
				labels: {
					style: {
						color: chart.series[0].color
					}
				},
			});
			
			chart.yAxis[1].update({
				title: {
					style: {
						color: chart.series[1].color
					}
				},
				labels: {
					style: {
						color: chart.series[1].color
					}
				},
			});
			
			// update series 0 chart
			var seriessock = chart.series[0];
			
			if (seriessock.data.length) {
				var lastvalupdated;
				
				for (j = 0; j < seriessock.data.length; j++) {
					if ((markerlistsock.indexOf(seriessock.data[j].y) >= 0) && (seriessock.data[j].y != lastvalupdated)) {
						seriessock.data[j].update({
							marker:{
								enabled: true,
								symbol: 'circle',
								radius: 7,
								fillColor: 'white',
								lineColor: '#FF0000',
								lineWidth: 1,
								states: {
									allowPointSelect: true,
									hover: {
										fillColor: 'red',
										lineColor: 'red'                                	
									}
								}
							}
						});
						
						lastvalupdated = seriessock.data[j].y;
					}
				}
			}
			
			chart.redraw();
			
			$('#ct-chartactivity2').css({ "height": graphactivity2height +"px" });
			$('#ct-chartactivity2').css({ "display": "inline-block" });
			//$('#ct-chartactivity2').highcharts().reflow();
			chart.setSize($(chart.container).parent().width() - 10, $(chart.container).parent().height() - 10);
			
			// activity 3 computations
			displayactivitythreevalues();
		}

		catch (err) {
			resizebodycontents();
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function displayactivitythreevalues() {
		try {
			$('#divactivity3computedtable').empty();
			activity3tablecomputations = [];
			
			var targetedarea = totalacreageglobal;
			var socseq = parseFloat(activity1tablecomputations[activity1tablecomputations.length - 1][9]);
			totalyearsglobal = parseFloat(activity2tablecomputations[4][1]);
			var rowvalues = [];
			
			$('#divactivity3computedtable').append('<p>SOC-sequestration over time</p>' +
				'<table id="tblactivity3computedvaluesA" class="table table-striped table-bordered table-condensed"><thead><th>Item</th><th>Value</th></thead><tbody></tbody>');
			
			rowvalues = ["Total targeted area (Mha)", targetedarea];
			activity3tablecomputations.push(rowvalues);
			$('#tblactivity3computedvaluesA').find('tbody').append('<tr><td class="uneditvalues">' + activity3tablecomputations[activity3tablecomputations.length - 1][0] + '</td><td class="uneditvalues">' + formatNumber(activity3tablecomputations[activity3tablecomputations.length - 1][1], 0) + '</td></tr>');
			
			rowvalues = ["SOC seq. (t/ha)", socseq];
			activity3tablecomputations.push(rowvalues);
			$('#tblactivity3computedvaluesA').find('tbody').append('<tr><td class="uneditvalues">' + activity3tablecomputations[activity3tablecomputations.length - 1][0] + '</td><td class="uneditvalues">' + formatNumber(activity3tablecomputations[activity3tablecomputations.length - 1][1], 0) + '</td></tr>');
			
			//if all land is brought under sequestration
			$('#divactivity3computedtable').append('<p>If all land is brought under sequestration</p>' +
				'<table id="tblactivity3computedvaluesB" class="table table-striped table-bordered table-condensed"><thead><th>Item</th><th>Value</th></thead><tbody></tbody>');
			
			rowvalues = ["SOC-sequestration total (t)", targetedarea * socseq * 1000000];
			activity3tablecomputations.push(rowvalues);
			$('#tblactivity3computedvaluesB').find('tbody').append('<tr><td class="uneditvalues">' + activity3tablecomputations[activity3tablecomputations.length - 1][0] + '</td><td class="uneditvalues">' + formatNumber(activity3tablecomputations[activity3tablecomputations.length - 1][1], 0) + '</td></tr>');
			
			rowvalues = ["SOC-sequestration total (Mt)", targetedarea * socseq];
			activity3tablecomputations.push(rowvalues);
			$('#tblactivity3computedvaluesB').find('tbody').append('<tr><td class="uneditvalues">' + activity3tablecomputations[activity3tablecomputations.length - 1][0] + '</td><td class="uneditvalues">' + formatNumber(activity3tablecomputations[activity3tablecomputations.length - 1][1], 0) + '</td></tr>');
			
			// Increase of hectares under a SOC seq. scheme over time
			$('#divactivity3computedtable').append('<div id="divactivity3computedvaluesC" style="display: inline-block; vertical-align:top; width:60%;"><p id="prateconstanttotalarea" class="italicfont"></p>' +
				'<table id="tblactivity3computedvaluesC" class="table table-striped table-bordered table-condensed"><thead><th>Item</th><th>Value</th></thead><tbody></tbody></div>');
			
			$('#prateconstanttotalarea').text(rateconstanttotalareakey);
			
			rowvalues = ["Rate Constant", rateconsfactor/1000];
			activity3tablecomputations.push(rowvalues);
			$('#tblactivity3computedvaluesC').find('tbody').append('<tr><td class="uneditvalues">' + activity3tablecomputations[activity3tablecomputations.length - 1][0] + '</td><td class="editvaluesrateconstant" contenteditable=true title="Rate Constant" style="cursor:pointer;" data-title="Edit Rate Constant">' + formatNumber(activity3tablecomputations[activity3tablecomputations.length - 1][1], 1) + '</td></tr>');
			
			rowvalues = ["% Total land area at year 1", perctotalareafactor/1000];
			activity3tablecomputations.push(rowvalues);
			$('#tblactivity3computedvaluesC').find('tbody').append('<tr><td class="uneditvalues">' + activity3tablecomputations[activity3tablecomputations.length - 1][0] + '</td><td class="editvaluespertotalarea" contenteditable=true title="% Total Area at Year 1" style="cursor:pointer;" data-title="Edit % Total Area at Year 1">' + formatNumber(activity3tablecomputations[activity3tablecomputations.length - 1][1], 1) + '</td></tr>');
			
			rowvalues = ["Total Years", totalyearsglobal];
			activity3tablecomputations.push(rowvalues);
			$('#tblactivity3computedvaluesC').find('tbody').append('<tr><td class="uneditvalues">' + activity3tablecomputations[activity3tablecomputations.length - 1][0] + '</td><td class="uneditvalues">' + activity3tablecomputations[activity3tablecomputations.length - 1][1] + '</td></tr>');
			
			$('#divactivity3computedtable').append('<div id="divrangesliderrateconst" style="display: inline-block; vertical-align:middle; width: 20%; text-align: center; padding:15px;"><outputtop_rateconst></outputtop_rateconst><input id="range_slider_rateconst" type="range" min=' + minslidervalue_rateconst + ' max=' + maxslidervalue_rateconst + ' step="1" value=' + rateconsfactor + ' data-orientation="vertical"></div>');
			
			$('#divactivity3computedtable').append('<div id="divrangeslideryzero" style="display: inline-block; vertical-align:middle; width: 20%; text-align: center; padding:15px;"><outputtop_yzero></outputtop_yzero><input id="range_slider_yzero" type="range" min=' + minslidervalue_yzero + ' max=' + maxslidervalue_yzero + ' step="1" value=' + perctotalareafactor + ' data-orientation="vertical"></div>');
			
			var $element_rateconst = $('input[id="range_slider_rateconst"]');
			var $outputtop_rateconst = $('outputtop_rateconst');
			
			$element_rateconst
			  .rangeslider({
				polyfill: false,
				onInit: function() {
				  updateOutput($outputtop_rateconst[0], "Rate");
				},
				onSlideEnd: function(position, value) {
					updateactivity3graphvalues(0, value);
				}
			  })
			  .on('input', function() {
				updateOutput($outputtop_rateconst[0], "Rate");
			  });
			  
			$('.editvaluesrateconstant').editable({
				mode: "popup",
				validate: function(value) {
					// validate entry
					if (!$.isNumeric($.trim(value))) {
						return "Enter numeric value";
					}
					if (parseFloat($.trim(value)) < (minslidervalue_rateconst/1000) || parseFloat($.trim(value)) > (maxslidervalue_rateconst/1000)) {
						return "Invalid entry. Value must be between " + minslidervalue_rateconst/1000 + " and " + maxslidervalue_rateconst/1000;
					}
				}
			});
			
			$('.editvaluesrateconstant').on('shown', function(e, editable) {
				if ($.isNumeric(e.target.innerHTML)) {
					editable.input.$input.val(e.target.innerHTML);
				}
			});
			
			$('.editvaluesrateconstant').on('hidden', function (e, params) {
				if (params == "save") {
					var newval = parseFloat(e.target.innerHTML)*1000;
					$element_rateconst.val(newval).change();
					updateactivity3graphvalues(0, newval);
				}
			});
			
			var $element_yzero = $('input[id="range_slider_yzero"]');
			var $outputtop_yzero = $('outputtop_yzero');
			
			$element_yzero
			  .rangeslider({
				polyfill: false,
				onInit: function() {
				  updateOutput($outputtop_yzero[0], "%Area");
				},
				onSlideEnd: function(position, value) {
					updateactivity3graphvalues(1, value);
				}
			  })
			  .on('input', function() {
				updateOutput($outputtop_yzero[0], "%Area");
			  });
			  
			$('.editvaluespertotalarea').editable({
				mode: "popup",
				validate: function(value) {
					// validate entry
					if (!$.isNumeric($.trim(value))) {
						return "Enter numeric value";
					}
					if (parseFloat($.trim(value)) < (minslidervalue_yzero/1000) || parseFloat($.trim(value)) > (maxslidervalue_yzero/1000)) {
						return "Invalid entry. Value must be between " + minslidervalue_yzero/1000 + " and " + maxslidervalue_yzero/1000;
					}
				}
			});
			
			$('.editvaluespertotalarea').on('shown', function(e, editable) {
				if ($.isNumeric(e.target.innerHTML)) {
					editable.input.$input.val(e.target.innerHTML);
				}
			});
			
			$('.editvaluespertotalarea').on('hidden', function (e, params) {
				if (params == "save") {
					var newval = parseFloat(e.target.innerHTML)*1000;
					$element_yzero.val(newval).change();
					updateactivity3graphvalues(1, newval);
				}
			});
			
			$('#divactivity3computedtable').css({ "display": "inline-block" });
			
			// compute graph values
			computeactivity3graphvalues();
		}

		catch (err) {
			resizebodycontents();
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function updateactivity3graphvalues(slidertype, slidervalue) {
		try {
			var htable = document.getElementById('tblactivity3computedvaluesC');
			var hrows = htable.rows;
				
			if (slidertype == 0) {
				activity3tablecomputations[4][1] = parseFloat(slidervalue)/1000;
				hrows[1].cells[1].innerHTML = parseFloat(slidervalue)/1000;
				rateconsfactor = slidervalue;
				
			} else if (slidertype == 1) {
				activity3tablecomputations[5][1] = parseFloat(slidervalue)/1000;
				hrows[2].cells[1].innerHTML = parseFloat(slidervalue)/1000;
				perctotalareafactor = slidervalue;
			}
			
			computeactivity3graphvalues();
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}
	

	function updateOutput(el, val) {
		el.textContent = val;
	}


	function computeactivity3graphvalues() {
		try {
			$('#divactivity3graphtable').empty();
			activity3graphcomputations = [];
			var rowvalues = [];
			
			rowvalues = ["Year", "Area under Seq. - Added (%)", "Area under Seq. - Total (%)", "SOC-Seq (Mt/yr)"];
			activity3graphcomputations.push(rowvalues);
			
			totalyearsglobal = activity3tablecomputations[activity3tablecomputations.length - 1][1];
			var perctotalarea = activity3tablecomputations[activity3tablecomputations.length - 2][1]/100;
			var rate_const = activity3tablecomputations[activity3tablecomputations.length - 3][1];
			var targetarea = activity3tablecomputations[0][1];
			var activity1bulkdensityavg = activity1tablecomputations[activity1tablecomputations.length - 1][8];
			var activity1layerdepth = activity1tablecomputations[activity1tablecomputations.length - 3][3];
			
			var exp_decay;
			var exp_decay_total = 0.0;
			var area_year_soc_seq = 0.0;
			var activity2yearrange = [];
			var activity2annualsocseq = [];
			area_year_soc_seq_total = 0.0
			
			for (i = 1; i < activity2graphcomputations.length; i++) {
				activity2yearrange.push(activity2graphcomputations[i][0]);
				activity2annualsocseq.push(activity2graphcomputations[i][activity2graphcomputations[0].length - 1]);
			}
			
			var yearslabel = [];
			var exp_decay_list = [];
			var area_year_soc_seq_list = [];
			
			for (i = 0; i <= totalyearsglobal; i++) {
				if (i == 0) {
					yearslabel.push(i);
					exp_decay_list.push(null);
					area_year_soc_seq_list.push(null);
					rowvalues = [0, "", "", ""];
					
				} else {
					exp_decay = (ExpDecay(perctotalarea, i - 1, rate_const) * 100);
					exp_decay_total += exp_decay;
					area_year_soc_seq = Area_Year_SOC_Seq_NEW(totalyearsglobal, perctotalarea, rate_const, i, activity2yearrange, activity2annualsocseq, activity1bulkdensityavg, activity1layerdepth, targetarea);
					
					yearslabel.push(i);
					
					if (nographnegatives == true) {
						if (exp_decay_total >= 0.0) {
							exp_decay_list.push(exp_decay_total);
						} else {
							exp_decay_list.push(null);
						}
					
					} else {
						exp_decay_list.push(exp_decay_total);
					}
					
					if (nographnegatives == true) {
						if (area_year_soc_seq >= 0.0) {
							area_year_soc_seq_list.push(area_year_soc_seq);
						} else {
							area_year_soc_seq_list.push(null);
						}
					
					} else {
						area_year_soc_seq_list.push(area_year_soc_seq);
					}
					
					rowvalues = [i, exp_decay, exp_decay_total, area_year_soc_seq];
				}
				
				activity3graphcomputations.push(rowvalues);
				area_year_soc_seq_total += area_year_soc_seq;
			}
			
			if (showcomputations == true) {
				for (i = 0; i < activity3graphcomputations.length; i++) {
					if (i == 0) {
						$('#divactivity3graphtable').append('<p>Computed Graph Values:</p>' +
						'<table id="tblactivity3graphvalues" class="table table-striped table-bordered table-condensed">');
						
						var headeritem = '<thead>';
						for (j = 0; j < activity3graphcomputations[i].length; j++) {
							headeritem+='<th>' + activity3graphcomputations[i][j] + '</th>';
						}
						headeritem+='</thead>' + '<tbody>' + '</tbody>';
						
						$('#tblactivity3graphvalues').append(headeritem);
						
					} else {
						var rowitem = '<tr>';
						
						for (k = 0; k < activity3graphcomputations[i].length; k++) {
							if (k == 0) {
								rowitem += '<td>' + activity3graphcomputations[i][k] + '</td>';
							} else {
								rowitem += '<td>' + formatNumber(activity3graphcomputations[i][k], 2) + '</td>';
							}
						}
						
						rowitem += '</tr>';
						$('#tblactivity3graphvalues').find('tbody').append(rowitem);
					}
				}
				
				$('#divactivity3graphtable').css({ "display": "inline-block" });
				renderdatatable('tblactivity3graphvalues', 'divactivity3graphtable', true);
			}
			
			// draw graph
			drawactivitythreegraph(yearslabel, exp_decay_list, area_year_soc_seq_list);
		}

		catch (err) {
			resizebodycontents();
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function drawactivitythreegraph(yearslabel, exp_decay_list, area_year_soc_seq_list) {
		var lowest_exp_decay_list = 0;
		var lowest_area_year_soc_seq_list = 0;
			
		try {
			// check if negatives
			if (nographnegatives == false) {
				lowest_exp_decay_list = getlowestvalue(exp_decay_list);
				lowest_area_year_soc_seq_list = getlowestvalue(area_year_soc_seq_list)
			}

			var chart = new Highcharts.Chart({
				chart: {
					renderTo: 'ct-chartactivity3',
					type: 'line'
				},
				credits: {
					enabled: false
				},
				title: {
					text: 'SOC Sequestration Over Time',
					x: -20 //center
				},
				xAxis: {
					title: {
						text: 'Year'
					},
					categories: yearslabel,
					gridLineColor: '#D8D8D8',
					gridLineWidth: 1
				},
				yAxis: [{
					title: {
						text: '% of Total Area'
					},
					plotLines: [{
						value: 0,
						width: 1,
						color: '#808080'
					}],
					allowDecimals: false,
					opposite: false,
					gridLineColor: '#D8D8D8',
					gridLineWidth: 1,
					min: lowest_exp_decay_list
				},{
					title: {
						text: 'SOC Seq. (Mt/yr)'
					},
					plotLines: [{
						value: 0,
						width: 1,
						color: '#808080'
					}],
					allowDecimals: true,
					opposite: true,
					gridLineColor: '#D8D8D8',
					gridLineWidth: 1,
					min: lowest_area_year_soc_seq_list
				}],
				plotOptions: {
					series: {
						marker: {
							enabled: false
						}
					}
				},
				legend: {
					layout: 'horizontal',
					align: 'center',
					verticalAlign: 'bottom',
					borderWidth: 0
				},
				series: [{
					name: '% Total Area',
					data: exp_decay_list,
					yAxis: 0,
					tooltip: {
						valueSuffix: ' %'
					}
				},{
					name: 'SOC Seq. (Mt/yr)',
					data: area_year_soc_seq_list,
					yAxis: 1,
					tooltip: {
						valueSuffix: ' Mt/yr'
					}
				}]
			});
			
			//update color
			chart.yAxis[0].update({
				title: {
					style: {
						color: chart.series[0].color
					}
				},
				labels: {
					style: {
						color: chart.series[0].color
					}
				},
			});
			
			chart.yAxis[1].update({
				title: {
					style: {
						color: chart.series[1].color
					}
				},
				labels: {
					style: {
						color: chart.series[1].color
					}
				},
			});
			
			$('#ct-chartactivity3').css({ "height": graphactivity3height });
			$('#ct-chartactivity3').css({ "display": "inline-block" });
			$('#ct-chartactivity3').highcharts().reflow();
			//chart.setSize($(chart.container).parent().width() - 10, $(chart.container).parent().height() - 10);
			
			// final table computations
			displayfinaltablevalues();
		}

		catch (err) {
			resizebodycontents();
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function displayfinaltablevalues() {
		try {
			// update or insert new record
			var selrow;
			var edittable = document.getElementById('tbltotalsocsequestration');
			for (i = 0; i < edittable.rows.length; i++) {
				if (edittable.rows[i].cells[0].innerHTML.toUpperCase() == $('#txtlocality').val().toUpperCase() && edittable.rows[i].cells[1].innerHTML.toUpperCase() == $("#txtlanduse").val().toUpperCase()) {
					selrow = edittable.rows[i];
				}
			}
			
			if (selrow) {
				// update
				selrow.cells[2].innerHTML = totalyearsglobal;
				selrow.cells[3].innerHTML = formatNumber(area_year_soc_seq_total, 0);
				
			} else {
				// insert
				$('#tbltotalsocsequestration').find('tbody').append('<tr>' +
						'<td>' + $('#txtlocality').val() + '</td>' +
						'<td>' + $("#txtlanduse").val() + '</td>' +
						'<td>' + totalyearsglobal + '</td>' +
						'<td>' + formatNumber(area_year_soc_seq_total, 0) + '</td>' +
					'</tr>');
					
				//// insert
				//$('#tbltotalsocsequestration').find('tbody').append('<tr>' +
				//		'<td class="uneditvalues">' + $('#txtlocality').val() + '</td>' +
				//		'<td class="uneditvalues">' + $("#txtlanduse").val() + '</td>' +
				//		'<td class="uneditvalues">' + totalyearsglobal + '</td>' +
				//		'<td class="uneditvalues">' + area_year_soc_seq_total + '</td>' +
				//	'</tr>');
			}
			
			// total
			var cnt = 0;
			var totalsocseq = 0.0;
			var alllanduse;
			edittable = document.getElementById('tbltotalsocsequestration');
			for (i = 0; i < edittable.rows.length; i++) {
				if (edittable.rows[i].cells[0].innerHTML.toUpperCase() == $('#txtlocality').val().toUpperCase() && edittable.rows[i].cells[1].innerHTML.indexOf(",") == -1) {
					totalsocseq += parseFloat(edittable.rows[i].cells[3].innerHTML);
					if (!alllanduse) {
						alllanduse = edittable.rows[i].cells[1].innerHTML;
					} else {
						alllanduse = alllanduse + ", " + edittable.rows[i].cells[1].innerHTML;
					}
					cnt+=1;
				}
			}
			
			if (cnt > 1) {
				selrow = "";
				edittable = document.getElementById('tbltotalsocsequestration');
				for (i = 0; i < edittable.rows.length; i++) {
					if (edittable.rows[i].cells[0].innerHTML.toUpperCase() == $('#txtlocality').val().toUpperCase() && edittable.rows[i].cells[1].innerHTML == alllanduse) {
						selrow = edittable.rows[i];
					}
				}
				
				if (selrow) {
					selrow.cells[3].innerHTML = formatNumber(totalsocseq, 0);
				
				} else {
					// insert
					$('#tbltotalsocsequestration').find('tbody').append('<tr>' +
						'<td>' + $('#txtlocality').val() + '</td>' +
						'<td>' + alllanduse + '</td>' +
						'<td>' + totalyearsglobal + '</td>' +
						'<td>' + formatNumber(totalsocseq, 0) + '</td>' +
					'</tr>');
				}
			}
			
			$('#divtotalsocsequestration').css({ "display": "inline-block" });
			if ($('#tbltotalsocsequestration').find('tbody tr').length == 1) {
				renderdatatable('tbltotalsocsequestration', 'divtotalsocsequestration', false);
			}
			
			resizebodycontents();
		}

		catch (err) {
			resizebodycontents();
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function activity2tablevalueschanged($cell) {
		try {
			activity2tablecomputations = [];
			
			// check if cells are numeric
			if (!$.isNumeric(cleaninnerhtml($cell.innerHTML))) {
				$cell.style.borderColor = "#FF0000";
				$cell.style.borderWidth = "1.5px";
				return;
				
			} else {
				$cell.style.borderColor = "#dddddd";
				$cell.style.borderWidth = "1px";
			}
			
			var htable = document.getElementById('tblactivity2computedvalues');
			var hrows = htable.rows;
			
			// if year numeric and changed
			if ($cell.cellIndex == 1 && $cell.parentNode.rowIndex == 4) {
				totalyearsglobal = parseInt(hrows[4].cells[1].innerHTML);
				hrows[2].cells[1].innerHTML = totalyearsglobal/3;
				hrows[3].cells[1].innerHTML = totalyearsglobal * 2/3;
			}
			
			// check values
			if ((parseFloat(cleaninnerhtml(hrows[2].cells[1].innerHTML)) >= parseFloat(cleaninnerhtml(hrows[3].cells[1].innerHTML))) || (parseFloat(cleaninnerhtml(hrows[2].cells[2].innerHTML)) >= parseFloat(cleaninnerhtml(hrows[3].cells[2].innerHTML))) || (parseFloat(cleaninnerhtml(hrows[3].cells[1].innerHTML)) >= parseFloat(cleaninnerhtml(hrows[4].cells[1].innerHTML))) || (parseFloat(cleaninnerhtml(hrows[3].cells[2].innerHTML)) > parseFloat(cleaninnerhtml(hrows[4].cells[2].innerHTML)))) {
				$cell.style.borderColor = "#FF0000";
				$cell.style.borderWidth = "1.5px";
				return;
				
			} else {
				$cell.style.borderColor = "#dddddd";
				$cell.style.borderWidth = "1px";
			}
			
			// compute layer 1 values
			hrows[2].cells[hrows[0].cells.length - 1].innerHTML = (parseFloat(cleaninnerhtml(hrows[2].cells[2].innerHTML)) - parseFloat(cleaninnerhtml(hrows[1].cells[2].innerHTML)))/(parseFloat(cleaninnerhtml(hrows[4].cells[2].innerHTML)) - parseFloat(cleaninnerhtml(hrows[1].cells[2].innerHTML))) * 100.0;
			hrows[3].cells[hrows[0].cells.length - 1].innerHTML = (parseFloat(cleaninnerhtml(hrows[3].cells[2].innerHTML)) - parseFloat(cleaninnerhtml(hrows[1].cells[2].innerHTML)))/(parseFloat(cleaninnerhtml(hrows[4].cells[2].innerHTML)) - parseFloat(cleaninnerhtml(hrows[1].cells[2].innerHTML))) * 100.0;
			
			// compute other values
			for (i = 3; i < hrows[0].cells.length - 1; i++) {
				hrows[2].cells[i].innerHTML = parseFloat(cleaninnerhtml(hrows[1].cells[i].innerHTML)) + (parseFloat(cleaninnerhtml(hrows[2].cells[hrows[0].cells.length - 1].innerHTML))/100.0) * (parseFloat(cleaninnerhtml(hrows[4].cells[i].innerHTML)) - parseFloat(cleaninnerhtml(hrows[1].cells[i].innerHTML)));
				hrows[3].cells[i].innerHTML = parseFloat(cleaninnerhtml(hrows[1].cells[i].innerHTML)) + (parseFloat(cleaninnerhtml(hrows[3].cells[hrows[0].cells.length - 1].innerHTML))/100.0) * (parseFloat(cleaninnerhtml(hrows[4].cells[i].innerHTML)) - parseFloat(cleaninnerhtml(hrows[1].cells[i].innerHTML)));
			}
			
			for (i = 0; i < hrows.length; i++) {
				var colvals = [];
				for (j = 0; j < hrows[i].cells.length; j++) {
					colvals.push(cleaninnerhtml(hrows[i].cells[j].innerHTML));
				}
				activity2tablecomputations.push(colvals);
			}
			
			// compute graph values
			computeactivity2graphvalues();
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function tablevaluesvalid(inputtable) {
		var isvalid = true;

		try {
			if (inputtable.find('tr').length <= 1) {
				isvalid = false;
				return isvalid;
			}
			
			inputtable.find('tr').each(function () {
				$(this).find('td').each(function () {
					if (!$(this).is(':nth-last-child(1)') && !$(this).is(':nth-last-child(2)')) {
						
						if (!$.isNumeric($(this).text())) {
							isvalid = false;
							$(this).css ({
								"border": "solid 2px #FF0000"
							});
						} else {
							$(this).css ({
								"border": "solid 1px #dddddd"
							});
						}
					}
				});
			});
			
			return isvalid;
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
			return isvalid;
		}
	}


	function cleaninnerhtml(cellvalue) {
		return cellvalue.replace(/<br>/g, '');
	}


	function repositionfooter() {
		try {
			if (($('body').outerHeight() + $('footer').outerHeight()) < $(window).outerHeight()) {
				$('footer').css({"bottom": 0, "position": "absolute", "overflow": "hidden"  });
			
			} else {
				$('footer').css({"top": $('body').outerHeight(), "position": "absolute", "overflow": "hidden" });
			}
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function checkbeginningsameY(x_range, y_range) {
		var checkvalue = true;
		var xvalue;
		var yvalue;
		var returnvalue = [null, null];

		try {
			for (i = 0; i < y_range.length; i++) {
				if (i == 0) {
					xvalue = x_range[i];
					yvalue = y_range[i];
				
				} else {
					if (checkvalue == true) {
						if (y_range[i] == y_range[i-1]) {
							xvalue = x_range[i];
							yvalue = y_range[i];
							
						} else {
							checkvalue = false;
						}
					}
				}
				
				if (checkvalue == false) {
					break;
				}
			}
			returnvalue = [xvalue, yvalue];
			return returnvalue;
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
			return returnvalue;
		}
	}


	function checklastsameY(x_range, y_range) {
		var xvalue;
		var yvalue;
		var returnvalue = [null, null];

		try {
			for (i = 0; i < y_range.length; i++) {
				if (i == 0) {
					xvalue = x_range[i];
					yvalue = y_range[i];
				
				} else {
					if (y_range[i] == y_range[i-1]) {
						xvalue = x_range[i-1];
						yvalue = y_range[i-1];
						
					} else {
						xvalue = x_range[i];
						yvalue = y_range[i];
					}
				}
			}

			returnvalue = [xvalue, yvalue];
			return returnvalue;
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
			return returnvalue;
		}
	}


	function getlowestvalue(inputlist) {
		var returval = 0;
		var lowval = 0;

		try {
			for (i = 0; i < inputlist.length; i++) {
				if ($.isNumeric(inputlist[i])) {
					if (parseFloat(inputlist[i]) < lowval) {
						lowval = parseFloat(inputlist[i]);
					}
				}
			}
			
			if (lowval < 0) {
				returval = lowval;
			}
			
			return returval;
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
			return returval;
		}
	}


	function resizebodycontents() {
		try {
			$('#outerdiv').css({ "display": "inline-block" });
				
			if (showcomputations == true) {
				$('.divspacer').css({"display": "inline-block"});
			} else {
				$('.divspacer').css({"display": "none"});
			}
			
			$('.panel-collapse').collapse('show');
			repositionfooter();
		}

		catch (err) {
			messiprompt("An error has occured: " + err.message, "Error", "messierror");
		}
	}


	function roundNumber(num, n) {
		return parseFloat(num).toFixed(n);
	}


	function formatNumber (num, rindex) {
		if ($.isNumeric(num)) {
			if (rindex == 0) {
				return num;
			} else if (rindex == 1) {
				return num.toLocaleString();
			} else if (rindex == 2) {
				return roundNumber(num, decplaces).toLocaleString();
			}
			
		} else {
			return "";
		}
	}
	

	function renderdatatable(tableid, divid, destroy) {
		if (destroy == false) {
			$('#' + tableid).DataTable(
				{
					// Disable sorting on the no-sort class
					"sPaginationType": "full_numbers",
					"bDestroy" : true,
					"ordering": false,
					"bFilter": false,
					"bInfo": true,
					"bLengthChange": false,
					//"aLengthMenu": [[10, 25, 50, 75, 100, -1], [10, 25, 50, 75, 100, "All"]],
					"pageLength": 10
			});
			
		} else {
			$('#' + tableid).DataTable(
				{
					// Disable sorting on the no-sort class
					"sPaginationType": "full_numbers",
					"bDestroy" : false,
					"ordering": false,
					"bFilter": false,
					"bInfo": true,
					"bLengthChange": false,
					//"aLengthMenu": [[10, 25, 50, 75, 100, -1], [10, 25, 50, 75, 100, "All"]],
					"pageLength": 10
			});
		}
	}
	
	
	function messiprompt(msg, title, titleanimation) {
            var titleclass;

            if (titleanimation == "messisuccess") {
                titleclass = 'success';

            } else if (titleanimation == "messiinfo") {
                titleclass = 'info';

            } else if (titleanimation == "messiwarning") {
                titleclass = 'anim warning';

            } else if (titleanimation == "messierror") {
                titleclass = 'anim error';
            }

            new Messi(msg, { title: title, titleClass: titleclass, modal: true });
        }
	

	// From VBA codes
	function SOC_Konv(SOC_percent, BD, Layer_Thickness_cm) { // SOC_percent As Double, BD As Double, Layer_Thickness_cm As Double
		// BD in g cm-3, Layer thickness in cm, SOC as soil organc _carbon_ in percent
		return(SOC_percent * BD * Layer_Thickness_cm); //Result is Mg ha-1 depth-1; depth in cm
	}


	function cubic_spline(Input_x_range, Input_y_range, X_for_which_2find_Y, no_negative, no_overshoot) { // Input_x_range As Range, Input_y_range As Range, X_for_which_2find_Y As Double
		/*Purposecubic_spline:   Given a data set consisting of a list of x values
				   and y values, this function will smoothly interpolate
				   a resulting output (y) value from a given input (x) value */

		// This counts how many points are in "input" and "output" set of data
		var input_count; // Integer
		var output_count; // Integer

		var input_count = Input_x_range.length; // row count
		var output_count = Input_y_range.length; // row count

		// Next check to be sure that "input" # points = "output" # points
		if (input_count != output_count) {
			return "Something's messed up!  The number of indices number of input x and y ranges don't match!";
		}

		var xin = new Array(input_count); // ReDim xin(input_count) As Single
		var yin = new Array(input_count); // ReDim yin(input_count) As Single
		var c; // Integer

		for (c = 0; c < input_count; c++) {
			xin[c] = Input_x_range[c];
			yin[c] = Input_y_range[c];
		}

		// values are populated
		var n; // Integer 'n=input_count
		var i, K; // Integer 'these are loop counting integers
		var p, qn, sig, un; // Single
		var U = new Array(input_count - 1); // ReDim U(input_count - 1) As Single
		var yt = new Array(input_count); //ReDim yt(input_count) As Single 'these are the 2nd deriv values

		n = input_count;
		yt[0] = 0;
		U[0] = 0;

		for (i = 1; i < n - 1; i++) {
			
			sig = (xin[i] - xin[i - 1]) / (xin[i + 1] - xin[i - 1]);
			p = sig * yt[i - 1] + 2;
			yt[i] = (sig - 1) / p;
			
			U[i] = (yin[i + 1] - yin[i]) / (xin[i + 1] - xin[i]) - (yin[i] - yin[i - 1]) / (xin[i] - xin[i - 1]);
			
			U[i] = (6 * U[i] / (xin[i + 1] - xin[i - 1]) - sig * U[i - 1]) / p;
		}

		qn = 0;
		un = 0;

		yt[n - 1] = (un - qn * U[n - 2]) / (qn * yt[n - 2] + 1);

		for (K = n - 2; K >= 0; K--) {
			yt[K] = yt[K] * yt[K + 1] + U[K];
			
		}

		// now eval spline at one point
		var klo, khi; // Integer
		var h, b, a; // Single

		// first find correct interval
		klo = 0;
		khi = n - 1;
		K = khi - klo;

		do {
			if (xin[K-1] > X_for_which_2find_Y) {
				khi = K-1;
			} else {
				klo = K-1;
			}
			
			K = khi - klo;
			
		}
		while (K > 1);

		var Y; // Double

		// ********* check if multiplication should be float
		h = xin[khi] - xin[klo];
		a = (xin[khi] - X_for_which_2find_Y) / h;
		b = (X_for_which_2find_Y - xin[klo]) / h;

		Y = a * yin[klo] + b * yin[khi] + ((Math.pow(a, 3) - a) * yt[klo] + (Math.pow(b, 3) - b) * yt[khi]) * (Math.pow(h, 2)) / 6;

		var Max_left_right;// As Double 'RS added for overshooting test

		Max_left_right = Math.max(yin[khi], yin[klo]);

		//RS added - prevent cubic spline from 'overshooting'
		if (no_overshoot == true && Max_left_right < Y) {
			Y = Max_left_right;
		}

		//preventing negative predictions!
		if (no_negative == true && Y < 0) {
			Y = 0.0;
		}

		return Y;
	}


	// get exponential
	function ExpDecay(Y_t0, Jahr, rate_const) { // Y_t0 As Double, Jahr As Double, rate_const As Double
		return Y_t0 * (Math.exp(Math.log(rate_const) * Jahr));
	}


	function Area_Year_SOC_Seq_NEW(Jahre, Area_Time0, Area_rate_const, x, CubicSpline_X_range, CubicSpline_Y_range, BD, SoilDepth, Total_Area) { // Jahre As Integer, Area_Time0 As Double, Area_rate_const As Double, x As Double, CubicSpline_X_range As Range, CubicSpline_Y_range As Range, BD As Double, SoilDepth As Double, Total_Area As Double
		/*
		Jahre is the number of years for which each year additional area (following the exponential decay function)
		is added to sequestration campain
		x is the sequestration year
		*/

		var returnvalue = 0.0;
		var Area_Exp_Decay = new Array(); // Double
		var SOC_Seq_Rate = new Array(); // Double
		var Area_Seq_Year = new Array(); // Double

		for (AreaYear = Jahre; AreaYear >= 1; AreaYear--) {
			Area_Exp_Decay[AreaYear] = ExpDecay(Area_Time0, AreaYear - 1, Area_rate_const);
		}

		for (SeqYear = x; SeqYear >= 1; SeqYear--) {
			SOC_Seq_Rate[SeqYear] = cubic_spline(CubicSpline_X_range, CubicSpline_Y_range, SeqYear, nographnegatives, nographovershoot);
		}

		SeqYear = x;

		for (AreaYear = 1; AreaYear <= Jahre; AreaYear++) {
			Area_Seq_Year[AreaYear] = SOC_Seq_Rate[SeqYear] * Area_Exp_Decay[AreaYear] * Total_Area;
			returnvalue += Area_Seq_Year[AreaYear];
			SeqYear -= 1;
			if (SeqYear < 1) {
				break;
			}
		}

		return returnvalue;
	}


	function Four_Param_Sigmoid(x, a, b, x0, Y0) { // x As Double, a As Double, b As Double, x0 As Double, Y0 As Double  
		return Y0 + a / (1 + Math.exp(-(x - x0) / b));
	}


	function FourSigm_a(x, b, x0, Y0, SOCx) { // x As Double, b As Double, x0 As Double, Y0 As Double, SOCx As Double
		return (SOCx - Y0) * (1 + Math.exp((x0 - x) / b));
	}


	function Annual_SOC_Seq_Rate(x, x_minus_1, a, b, x0, Y0, BD, SoilDepth) { // x As Double, x_minus_1 As Double, a As Double, b As Double, x0 As Double, Y0 As Double, BD As Double, SoilDepth As Double
		/*
		calculated the annual Soil Organic Carbon sequestration amount in Mg/ha/SoilDepth
		for the given increase in %-SOC based on a four-parameter sigmoid function
		Soil depth in cm
		BD in g/cm3
		*/

		var SOC0; // Double
		var SOC1; // Double
		var delta_SOC; // Double

		SOC0 = Four_Param_Sigmoid(x_minus_1, a, b, x0, Y0); // SOC-% last year
		SOC1 = Four_Param_Sigmoid(x, a, b, x0, Y0); // SOC-% current year
		delta_SOC = SOC1 - SOC0;

		return SOC_Konv(delta_SOC, BD, SoilDepth);
	}
}(jQuery);