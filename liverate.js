"use strict"

/**
 * API wrapper for Live Rating System
 * 
 * @author Enda Xue <xueenda@gmail.com>
 */

/**
 * Module dependencies.
 */
 
var request = require('request')
  , sort = require('sort-object')
  , crypto = require('crypto')
  , extend = require('extend')
  , queryString = require('querystring')

var LIVERATE_API_ROOT = 'http://rate.kagogo.co/v1/'

/**
 * Initialize the Liverate class
 * 
 * @param {string} key
 * @param {string} secret
 */
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
  saveRate: function(query, callback){
    var params = {
      uri: 'rate/save',
      query: query,
      method: 'POST' 
    }
    this._call(params, callback)
  },

  /** 
   * Get the rates of an Object
   */ 
  getRate: function(query, callback){
    var params = {
      uri: 'rate/get',
      query: query,
      method: 'GET' 
    }
    this._call(params, callback)
  },

  /** 
   * Save the feedback of an Object
   */ 
  saveFeedback: function(query, callback){
    var params = {
      uri: 'feedback/save',
      query: query,
      method: 'POST' 
    }
    this._call(params, callback)
  },

  /** 
   * Get the feedbacks of an Object
   */ 
  getFeedbacks: function(query, callback){
    var params = {
      uri: 'feedback/get',
      query: query,
      method: 'GET' 
    }
    this._call(params, callback)
  },

  /** 
   * Get the list of Objects
   */ 
  listObjects: function(query, callback){
    var params = {
      uri: 'object/list',
      query: query,
      method: 'GET' 
    }
    this._call(params, callback)
  },

  /**
   * Call the actual API
   * 
   * @param {object} params
   */
  _call: function(params, callback){
    this.timestamp = new Date().getTime()
    this.url = LIVERATE_API_ROOT + params.uri + (params.method == 'GET' ? '?' + queryString.stringify(params.query) : '')

    var options = {
      url: this.url,
      method: params.method,
      headers: {
        'API' : this.key,
        'TIMESTAMP': this.timestamp,
        'SIGNATURE': this._generateSignature(params)
      }
    }

    if(params.method == 'POST'){
      for(var key in params.query){
        params.query[key] = decodeURIComponent(params.query[key])
      }
      options.form = params.query
    }

    request(options, function(error, response, body) {
      parser(error, response, body, callback)
    })
  },

  /**
   * Generate signature
   */
  _generateSignature: function(params){
    var AppSecret = this.secret
    var token = [this.key, this.timestamp, this.secret].join('&')

    var requestObject = {
      url: this.url,
      method: params.method,
      parameters: params.query,
      headers: {auth_api:this.key, auth_timestamp:this.timestamp}
    }

    return buildSignature(requestObject, token)
  }
}

/**
 * Parser for the result
 * 
 * @param {string} error
 * @param {object} response
 * @param {string} body
 * @param {function} callback
 */
function parser(error, response, body, callback) {
  if (!error && response.statusCode == 200)
    callback(error, JSON.parse(body)) 
  else
    callback(error+' '+response)
}

/**
 * Build the signature
 * 
 * @param {object} request
 * @param {string} token
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
