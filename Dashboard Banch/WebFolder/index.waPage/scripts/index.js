var _template = ''
WAF.onAfterInit = function onAfterInit() { // @lock

	// @region namespaceDeclaration// @startlock
	var start_stop = {}; // @button
	var documentEvent = {}; // @document
	// @endregion// @endlock

	var timer;
	var $ebs = $$('ebs_container').$domNode;
	var $eph = $$('eph_container').$domNode;

	function msToTime(s) {

		function castTo(n, length) {
			var res = n + '';
			
			length = length || 2;
			
			while(res.length < length){
				res = '0' + res;
			}
			return res;
		}

		var ms = s % 1000;
		s = (s - ms) / 1000;
		var secs = s % 60;
		s = (s - secs) / 60;
		var mins = s % 60;
		var hrs = (s - mins) / 60;

		return castTo(hrs) + 'h ' + castTo(mins) + 'min ' + castTo(secs) + 's ' + castTo(ms,3);
	}

	function render(status) {
		$
			.get('/templates/bench.html')
			.done(function(resp) {
				var temp = _.template(resp);
				$ebs.html(temp(status.EBS.result));
				$eph.html(temp(status.EPH.result));
			});

		timer = setInterval(function refresh() {
			var status = bench.status();

			var ebs_res = update(status.EBS.result.data, status.EBS.result.config, $ebs);
			var eph_res = update(status.EPH.result.data, status.EPH.result.config, $eph);

			if (ebs_res.finished && eph_res.finished) {
				clearInterval(timer);
				setMode('stopped');
			}

			$$('ebs_average').setValue(msToTime(parseInt(ebs_res.average)));
			$$('eph_average').setValue(msToTime(parseInt(eph_res.average)));
		}, 700);
	};

	function update(data, config, $container) {
		var finished = true;
		var average = 0;
		var nb = 0;

		for (var index in data) {
			if (!data.hasOwnProperty(index)) {
				continue;
			}

			var conf = config.config;
			var res = data[index].data;
			var emp_per = 100 * res.generated.employees / conf.employees.nb;
			var comp_per = 100 * res.generated.companies.nb / conf.companies.nb;
			var comp_emp_per = 100 * res.generated.companies.emps / conf.companies.employees.nb;
			var $unit = $container.find('.unit-' + index);

			updateBar($unit.find('.employees'), emp_per);
			updateBar($unit.find('.companies'), comp_per);
			updateBar($unit.find('.comp_employees'), comp_emp_per);

			$unit.find('span.completed').html(data[index].finished + '').css('color', data[index].finished ? 'green' : 'red');
			$unit.find('span.duration').html(res.duration);
			$unit.find('span.errors').html(res.errors.length);

			if (!data[index].finished) {
				finished = false;
			}

			nb++;
			average += res.duration;
		}

		return {
			finished: finished,
			average: nb > 0 ? average / nb : 0
		};
	};

	function updateBar($bar, value) {
		$bar
			.find('div.progress-bar').css('width', value + '%')
			.find('span').html(value + '% Complete')
	};

	function setMode(mode) {
		var start_stop = $$('start_stop');

		switch (mode) {
			case 'running':
				$('.waf-widget.config').each(function() {
					$$(this.id).disable();
				});
				start_stop.setValue('Stop');
				start_stop.$domNode.addClass('stop');
				break;
			case 'stopped':
			default:
				$('.waf-widget.config').each(function() {
					$$(this.id).enable();
				});
				start_stop.setValue('Start');
				start_stop.$domNode.removeClass('stop');
				break;
		}
	};

	// eventHandlers// @lock

	start_stop.click = function start_stop_click(event) // @startlock
	{ // @endlock
		var canStart = bench.canStart();

		if (canStart === true) {
			bench.start(config);
			setTimeout(function() {
				render(bench.status());
			}, 500);
			setMode('running');
		} else {
			bench.stop();
			clearInterval(timer);
			setMode('stopped');
		}
	}; // @lock

	documentEvent.onLoad = function documentEvent_onLoad(event) // @startlock
	{ // @endlock
		var services = bench.services();

		$('#eph_db a').attr('href', 'http://' + services.EPH + '/walib/dataBrowser/index.html');
		$('#ebs_db a').attr('href', 'http://' + services.EBS + '/walib/dataBrowser/index.html');

		var canStart = bench.canStart();

		if (canStart === true) {
			config = {
				nbThreads: 10,
				nbComps: 50,
				nbEmps: 1000,
				nbCompEmps: 500,
				blobs: true,
				asBinary: true
			};

			sources.config.sync();

			setMode('stopped');
		} else {
			config = canStart.config;
			sources.config.sync();
			setMode('running');

			render(canStart.status);
		}

		$ebs.on({
			'scroll': function() {
				$eph.scrollTop(this.scrollTop);
			}
		});

		$eph.on({
			'scroll': function() {
				$ebs.scrollTop(this.scrollTop);
			}
		});


	}; // @lock

	// @region eventManager// @startlock
	WAF.addListener("start_stop", "click", start_stop.click, "WAF");
	WAF.addListener("document", "onLoad", documentEvent.onLoad, "WAF");
	// @endregion
}; // @endlock
