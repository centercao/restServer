module.exports = {
  "appenders": [
    {
      "type": "clustered",
      "appenders":[
          {
          "category": "console",
          "type": "console"
          },
          {
		      "category": "netFileLog",
		      "type": "dateFile",
		      "filename": "logs/net",
		      "pattern": "-yyyy-MM-dd.log",
		      "alwaysIncludePattern": true,
		      "pollInterval": 1
	      }
      ]
    }
  ],
  "replaceConsole": "true",
  "levels":{
    "console": "DEBUG",
    "netFileLog": "DEBUG"
  }
}