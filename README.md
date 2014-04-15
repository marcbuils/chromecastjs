# chromecastjs

## Current version

v0.1.0

## Licence

MIT

## Author

Marc Buils from Marc Buils Consultant Compagny (France)

(and sorry for my english. I work it, but currently it is very bad...)


## Description

JavaScript project based on ChromeCast API to build ChromeCast apps very easy

AMD and CommonJS compatible

Here all the requirements you need before to build the output files or to launch the dev mode:

- [NodeJS](http://nodejs.org/download/)
- [Grunt](http://gruntjs.com/) ```npm install -g grunt-cli```
- [PhantomJS](http://phantomjs.org/download.html) ```npm install -g phantomjs```
- [Bower](http://bower.io/) ```npm install -g bower```


## Getting Started

A Chromecast app is composed by
- Sender application to start your application from a device (on Google Chrome with ChromeCast plugin)
- Receiver application open on chromecast

### Install

- Bower
> bower install --save-dev chromecastjs

### Sender example
```html
<!DOCTYPE html>
<html>
<head>
<title>Hello World</title>
</head>
<body>
  <table id="wrapper">
	<tr>
		<td>
			<form method="get" action="JavaScript:update();">
				<input id="input" class="border" type="text" size="30" onwebkitspeechchange="transcribe(this.value)" x-webkit-speech/>
			</form>
		</td>
	</tr>
  </table>	

<script type="text/javascript" src="chromecast.js"></script>
<script type="text/javascript">
  var chromecastSender = chromecast.createSender({
    applicationID: 'XXXXXXXX',
    namespace: 'urn:x-cast:com.google.cast.sample.helloworld'
  });
  
  chromecastSender
    .on('error', function (err) {
      console.error(err);
    });

  function update() {
    chromecastSender.sendMessage(document.getElementById('input').value);
  }

  function transcribe(words) {
    chromecastSender.sendMessage(words);
  }
  
  document.getElementById('input').focus();
</script>
</body>
</html>
```


### Receiver example
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Cast Hello Text</title>
  </head>
  <body style="color: white; font-size: 10em">
	<div id="message">Talk to me</div>
    <script type="text/javascript" src="chromecast.js"></script>
    <script type="text/javascript">
      var chromecastReceiver = null;
    
      window.onload = function() {
          chromecastReceiver = chromecast.createReceiver({
            namespace: 'urn:x-cast:com.google.cast.sample.helloworld'
          });
          
          chromecastReceiver.on('message', function (infos) {
             document.getElementById('message').innerHTML=infos.data;
             this.setApplicationState(text);
          });
      };
    </script>
  </body>
</html>
```

## Usage

> chromecast.createSender({options})

Create a chromecastjs sender instance

> chromecast.createReceiver({options})

Create a chromecastjs receiver instance

 
### Sender

_WARNING: no message can be sent during the first second after initialize_


#### API

> on({event name}, {callback})

Register an event (see Getting Started / Sender / API / Events)


> sendMessage({message})

Send a message to the receiver app


#### Events

> message
> session
> initSuccess
> error
> success
> stopappsuccess
> sessionupdatelistener
> listener


### Receiver

#### API

> on({event name}, {callback})

Register an event (see Getting Started / Sender / API / Events)


> sendMessage({message})

Send a message to the receiver app


> getSenders()

Get list of senders


> disconnect()

Close the app


#### Events

- message
- ready
- senderconnected
- senderdisconnected
- systemvolumechanged


## Development

### Getting sources

This is how to launch the app quickly in dev mode:

> * clone the git repository:
> ```bash
> git clone https://github.com/marcbuils/chromecastjs.git
> ```
>
> * Run in chromecastjs folder:
>
> ```bash
> # Dependencies
> npm install; bower install
> # Start watcher for development
> grunt start
> ```

### Sending pull request

This is how to send a pull request:
- Fork the project on your github account
- Clone the project on local (see Development/Getting sources)
- Add feature / bugfixed
- Start test 
> * Run in chromecastjs folder:
>
> ```bash
> grunt test
> ```
- Commit and create a pull request with description of your modification

(: THANKS FOR YOUR PARTICIPATION :)

