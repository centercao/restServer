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
          "category": "dateFileLog",
          "type": "dateFile",
          "filename": "logs/web",
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
    "dateFileLog": "DEBUG"
  }
};