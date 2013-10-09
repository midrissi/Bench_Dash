var SERVICES = {
	EBS: {
		'private': '@private_adress',
		'public': '@public_address'
	},
	EPH: {
		'private': '@private_address',
		'public': '@public_address'
	}
};

function request (service, meth_name, params) {
	var xhr = new XMLHttpRequest(),
		result = {};

	xhr.open( 'POST' , 'http://' + SERVICES[service]['private'] + '/rest/Bench/' + meth_name , false );

	xhr.send(JSON.stringify(params));
	
	if (xhr.readyState == 4)
	{
        if (xhr.status == 200) 
        {
			try{
				return JSON.parse(xhr.responseText);
			}catch(e){
				return null;
			}
		}	
	}
};

function bench (meth_name, params) {
	return {
		EBS: request('EBS' , meth_name , params),
		EPH: request('EPH' , meth_name , params)
	};
};

exports.stop = function close(){
	return bench('stop' , []);
};

exports.start = function start (config) {
	return bench('generate' , [config]);
};

exports.remove = function remove () {
	return bench('empty' , []);
};

exports.status = function status () {
	return bench('status' , []);
};

exports.services = function services(){
	return {
		EBS: SERVICES.EBS['public'],
		EPH: SERVICES.EPH['public']
	};
}
