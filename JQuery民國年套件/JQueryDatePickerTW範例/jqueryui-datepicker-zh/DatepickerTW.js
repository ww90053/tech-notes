/**
 *  DatepickerTW.js
 *  民國年日期選擇器
 *  需要搭配jQueryUI使用
 */
(function () {
	var dateNative = new Date();

	// 補0函式
	// padStart()可能有相容性問題，所以用遞迴產生
	var padZero = function (padString, targetLength) {

		if (String(padString).length >= targetLength) {
			return padString;
		} else {
			return padZero(("0" + padString), targetLength);
		}
	};

	var funcColle = function () {
		this.onSelect = {
			basic: function (dateText, inst) {
				/*
				var yearNative = inst.selectedYear < 1911 ? inst.selectedYear + 1911 : inst.selectedYear;
				*/
				dateNative = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);

				// 年分小於100會被補成19**, 要做例外處理
				var yearTW;
				if (twSettings.yearPadZero) {
					if (inst.selectedYear > 1911) {
						yearTW = padZero((inst.selectedYear - 1911), 3);
					} else {
						yearTW = padZero(inst.selectedYear, 3)
					}
				} else {
					if (inst.selectedYear > 1911) {
						yearTW = inst.selectedYear - 1911;
					} else {
						yearTW = inst.selectedYear;
					}
				}
				var monthTW = padZero((inst.selectedMonth + 1).toString(), 2);
				var dayTW = padZero(inst.selectedDay, 2);

				return yearTW + twSettings.splitMark + monthTW + twSettings.splitMark + dayTW;
			}
		};
	};

	let twSettings = {
		closeText: '關閉',
		prevText: '上個月',
		nextText: '下個月',
		currentText: '今天',
		changeYear: true, //手動修改年
		changeMonth: true, //手動修改月
		//yearRange: '2016:' + (dateNative.getFullYear()+1),
		monthNames: [
			'一月', '二月', '三月', '四月', '五月',
			'六月', '七月', '八月', '九月', '十月',
			'十一月', '十二月'
		],
		monthNamesShort: [
			'一月', '二月', '三月', '四月', '五月',
			'六月', '七月', '八月', '九月', '十月',
			'十一月', '十二月'
		],
		dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
		dayNamesShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
		dayNamesMin: ['日', '一', '二', '三', '四', '五', '六'],
		weekHeader: '周',
		dateFormat: 'yy/mm/dd',
		splitMark: '/', // 分割年月日的標誌
		firstDay: 1,
		isRTL: false,
		showMonthAfterYear: true,
		yearSuffix: '',
		yearPadZero: false,
		beforeShow: function () {
			setTimeout(function () {
				$('.ui-datepicker').css('z-index', 1000);
			}, 0);
		}
		//, defaultLastYear: false
		, defaultDate: null
		/*
			當沒有設defaultDate時，先用yearRange做defaultDate
			此時defaultLastYear設定預設為最後一年or第一年
		*/
	};

	// 把yearText換成民國
	var replaceYearText = function () {
		var $yearText = $('.ui-datepicker-year');

		if (twSettings.changeYear !== true) {
			$yearText.text('民國' + (dateNative.getFullYear() - 1911) + '年');
		} else {
			// 下拉選單
			/*
						if($yearText.prev('span.datepickerTW-yearPrefix').length === 0){
							$yearText.before("民國  ");
						}
			*/
			$yearText.children().each(function () {
				if (parseInt($(this).text(), 10) > 1911) {
					let twYear = parseInt($(this).text(), 10) - 1911
					$(this).text(twYear);
				}
			});
		}
	};

	$.fn.datepickerTW = function (options) {
		if (typeof options === "undefined") {
			options = {};
		}

		var fn = new funcColle();
		// setting on init,
		if (typeof options == 'object') {
			//onSelect例外處理, 避免覆蓋
			if (typeof options.onSelect == 'function') {
				fn.onSelect.newFunc = options.onSelect;
			}

			options.onSelect = function (dateText, inst) {
				var outputValue = fn.onSelect.basic(dateText, inst);

				if (twSettings.yearPadZero) {
					outputValue = padZero(outputValue, 9);
				}
				$(this).val(outputValue);
				$(this).change();//觸發Change事件
				if (typeof fn.onSelect.newFunc === 'function') {

					if (outputValue) {
						//split
						let date = outputValue.split(twSettings.splitMark);
						//民國年轉西元年
						if (date[0] && parseInt(date[0]) < 1911) {
							date[0] = parseInt(date[0]) + 1911;
							outputValue = date[0] + twSettings.splitMark + date[1] + twSettings.splitMark + date[2];
						}
					}

					fn.onSelect.newFunc(outputValue, inst);
				}
			};

			// year range正規化成西元, 小於1911的數字都會被當成民國年
			if (options.yearRange) {
				var temp = options.yearRange.split(':');
				for (var i = 0; i < temp.length; i += 1) {
					//民國前處理
					if (parseInt(temp[i], 10) < 1) {
						temp[i] = parseInt(temp[i], 10) + 1911;
					} else {
						if (parseInt(temp[i], 10) < 1911) {
							temp[i] = parseInt(temp[i], 10) + 1911;
						} else {
							temp[i] = temp[i];
						}
					}
				}
				options.yearRange = temp[0] + ':' + temp[1];
			}

			// 預設default Date
			/*
			if (options.defaultDate) {

			} else if (options.yearRange) {
				var temp = options.yearRange.split(':');

				if (options.defaultLastYear) {
					options.defaultDate = temp[1] - new Date().getFullYear() + 'y';
				} else {
					options.defaultDate = temp[0] - new Date().getFullYear() + 'y';
				}
				
			} else if ($.trim($(this).val()) != '' && $(this).val() != undefined) {
				var tempDate = $(this).val().split(twSettings.splitMark);
				var tempYear = tempDate[0];

				var year;
				if (parseInt(tempYear, 10) < 1911) {
					year = padZero((parseInt(tempYear, 10) + 1911).toString(), 4);
				} else {
					year = parseInt(tempYear, 10);
				}

				options.defaultDate = year - new Date().getFullYear() + 'y';
			}
			*/
		}

		// setting after init
		if (arguments.length > 1) {
			// 目前還沒想到正常的解法, 先用轉換成init setting obj的形式
			if (arguments[0] === 'option') {
				options = {};
				options[arguments[1]] = arguments[2];
			}
		}

		// override settings
		$.extend(twSettings, options);

		// init
		$(this).datepicker(twSettings);

		// beforeRender
		$(this).click(function () {
			var isFirstTime = ($(this).val() == '');
			// year range and default date
			if ((twSettings.defaultDate || twSettings.yearRange) && isFirstTime) {
				/*              當有year range時, select初始化設成range的最末年
								已調整到上面"預設default Date"中
								if(twSettings.defaultDate){
									$(this).datepicker('setDate', twSettings.defaultDate);
								}
				 
								// 這段處理不好，因為「年」只改了外觀，但javascript實際值還是原本那年
								// 當有year range時, select初始化設成range的最末年
								if(twSettings.yearRange){
									var $yearSelect = $('.ui-datepicker-year'),
										nowYear = twSettings.defaultDate
											? $(this).datepicker('getDate').getFullYear()
											: dateNative.getFullYear();
				 
									$yearSelect.children(':selected').removeAttr('selected');
									if($yearSelect.children('[value=' + nowYear + ']').length > 0){
										$yearSelect.children('[value=' + nowYear + ']').attr('selected', 'selected');
									}else{
										$yearSelect.children().last().attr('selected', 'selected');
									}
								}
				*/
			} else {
				var tempDate = $(this).val().split(twSettings.splitMark);

				if (tempDate.length != 3) {
					$(this).datepicker('setDate', new Date());
				} else {
					var tempYear = tempDate[0];
					var tempMonth = tempDate[1] - 1;
					var tempDay = padZero(tempDate[2], 2);

					var year;
					if (parseInt(tempYear, 10) < 1911) {
						year = padZero((parseInt(tempYear, 10) + 1911).toString(), 4);
					} else {
						year = parseInt(tempYear, 10);
					}

					dateNative = new Date(year, tempMonth, tempDay);

					$(this).datepicker('setDate', dateNative);
				}
			}

			var yearTW;
			if (twSettings.yearPadZero) {
				if (dateNative.getFullYear() > 1911) {
					yearTW = padZero((dateNative.getFullYear() - 1911).toString(), 3);
				} else {
					yearTW = padZero(dateNative.getFullYear().toString(), 3);
				}
			} else {
				if (dateNative.getFullYear() > 1911) {
					yearTW = dateNative.getFullYear() - 1911;
				} else {
					yearTW = dateNative.getFullYear();
				}
			}
			var monthTW = padZero((dateNative.getMonth() + 1).toString(), 2);
			var dayTW = padZero(dateNative.getDate().toString(), 2);

			$(this).val(yearTW + twSettings.splitMark + monthTW + twSettings.splitMark + dayTW);

			replaceYearText();

			if (isFirstTime) {
				$(this).val('');
			}
		});

		// afterRender
		$(this).focus(function () {
			replaceYearText();
		});

		return this;
	};
})();