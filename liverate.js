'use strict';

var request = require('request')
  , sort = require('sort-object')
  , crypto = require('crypto')
  , extend = require('extend')

var LIVERATE_API_ROOT = 'http://rate.kagogo.co/v1/'

function Liverate(key, secret){
  if (!(this instanceof Liverate)) {
    return new Liverate(key, secret);
  }

  this.key = key
  this.secret = secret
}

Liverate.prototype = {

  /** 
   * Save the rate of an Object
   */ 
  saveRate: function(req, callback){
    var uri = 'rate/save'
    this._call(req, uri, callback)
  },

  /** 
   * Get the rates of an Object
   */ 
  getRate: function(req, callback){
    var uri = 'rate/get'
    this._call(req, uri, callback)
  },

  /** 
   * Save the feedback of an Object
   */ 
  saveFeedback: function(req, callback){
    var uri = 'feedback/save'
    this._call(req, uri, callback)
  },

  /** 
   * Get the feedbacks of an Object
   */ 
  getFeedbacks: function(req, callback){
    var uri = 'feedback/get'
    this._call(req, uri, callback)
  },

  /** 
   * Get the list of Objects
   */ 
  listObjects: function(req, callback){
    var uri = 'object/list'
    this._call(req, uri, callback)
  },

  /**
   * Generate signature
   */
  _generateSignature: function(req){
    var AppSecret = this.secret
    var token = [this.key, this.timestamp, this.secret].join('&')

    var parameters = {}
    // Combine http GET POST together
    extend(parameters, req.query, req.body) 
    //console.log(req)
    var requestObject = {
      url: this.url,
      method: req.method,
      parameters: parameters,
      headers: {auth_api:this.key, auth_timestamp:this.timestamp}
    }
    return buildSignature(requestObject, token)
  },

  /**
   * Call the actual API
   */
  _call: function(req, uri, callback){
    this.timestamp = new Date().getTime()
    this.url = LIVERATE_API_ROOT+uri+ (req._parsedUrl.query && req.method == 'GET' ? '?'+req._parsedUrl.query:'')

    var options = {
      url: this.url,
      method: req.method,
      headers: {
        'API' : this.key,
        'TIMESTAMP': this.timestamp,
        'SIGNATURE': this._generateSignature(req)
      }
    }

    request(options, function(error, response, body) {
      parser(error, response, body, callback)
    })
  }
}

/**
 * Parser for the result
 * @params {string} error
 * @params {string} response
 * @params {string} body
 * @params {function} callback
 */
function parser(error, response, body, callback) {
  if (!error && response.statusCode == 200)
    callback(error, JSON.parse(body)) 
  else
    callback(error)
}

/**
 * Parser for the result
 * @params {object} request
 * @params {string} token
 * @return {string} signature
 */
function buildSignature(request, token){

  var requestParameters = request.parameters
    
  extend(requestParameters, request.headers)

  for(var key in requestParameters){
    requestParameters[key] = encodeURIComponent(requestParameters[key])
  }

  requestParameters = sort(requestParameters)
  var parameterBase = []
  var i = 0

  for(var key in requestParameters){
    parameterBase[i] = key + "=" + requestParameters[key]
    i++
  }
  var parameterBaseString = parameterBase.join('&')
  // Generate the signature base
  var signatureBaseString = [(request.method).toUpperCase(), encodeURIComponent(request.url), encodeURIComponent(parameterBaseString)].join('&')
  // Generate the signature using the signature base as the message and the token as the key.
  var signature = crypto.createHmac('sha1', token).update(signatureBaseString).digest('base64')
  // Base64 encode the raw binary data. Return the signature
  return signature
}

module.exports = Liverate;