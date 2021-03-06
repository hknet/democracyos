var mongoose = require('mongoose');
var config = require('lib/config');
var api = require('lib/db-api');
var privileges = require('lib/models/forum/privileges');

var log = require('debug')('democracyos:forum:middleware');

var exports = module.exports = {};

exports.findForum = function findForum (req, res, next) {
  api.forum.findById(req.params.id, function (err, forum) {
    if (err) {
      log('Error fetching forum: %s', err);
      return res.status(400).send();
    }

    if (!forum) return res.status(404).send();

    req.forum = forum;
    next();
  });
};

exports.findForumByName = function findForumByName (req, res, next) {
  api.forum.findOneByName(req.query.name, function (err, forum) {
    if (err) {
      log('Error fetching forum: %s', err);
      return res.status(400).send();
    }

    if (!forum) {
      log(`Forum with name '${req.query.name}' not found.`);
      return res.status(404).send();
    }

    req.forum = forum;
    next();
  });
};

exports.findDefaultForum = function findDefaultForum (req, res, next) {
  if (config.multiForum) return next();

  api.forum.findDefaultForum(function (err, forum) {
    if (err) {
      log(err);
      return res.status(500).send();
    }

    if (forum) req.forum = forum;
    next();
  });
};

exports.privileges = function privilegesMiddlewareGenerator (privilege) {
  if (!privileges[privilege]) throw new Error('Wrong privilege name.');

  return function privilegesMiddleware (req, res, next) {
    var forum = req.forum;
    var user = req.user;

    if (!forum) {
      log('Couldn\'t find forum.');
      return res.status(404).send();
    }

    if (privileges[privilege](forum, user)) return next();

    log(`User tried to make a restricted action. User: ${user && user._id} Forum: ${forum.name} Privilege: ${privilege}`);
    return res.status(401).send();
  };
};
