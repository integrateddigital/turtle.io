/**
 * Session factory
 *
 * @method Session
 * @constructor
 * @param {String} id     Session ID
 * @param {Object} server TurtleIO instance
 */
function Session ( id, server ) {
	this._id        = id;
	this._server    = server;
	this._timestamp = 0;
}

// Setting constructor loop
Session.prototype.constructor = Session;

/**
 * Sessions
 *
 * @class sessions
 * @type {Object}
 * @todo too slow!
 */
TurtleIO.prototype.session = {
	/**
	 * Creates a session
	 *
	 * @method create
	 * @param  {Object} req HTTP(S) request Object
	 * @param  {Object} res HTTP(S) response Object
	 * @return {Object}     Session
	 */
	create : function ( req, res ) {
		var expires = this.server.session.expires,
		    domain  = req.parsed.host.isDomain() && !req.parsed.host.isIP() ? req.parsed.host : undefined,
		    secure  = ( req.parsed.protocol === "https:" ),
		    sid     = $.uuid( true ),
		    sesh;

		sesh = this.server.sessions[sid] = new Session( sid, this.server );
		this.server.cookie.set( res, this.server.config.session.id, sid, expires, domain, secure, "/" );

		return sesh;
	},

	/**
	 * Destroys a session
	 *
	 * @method destroy
	 * @param  {Object} req HTTP(S) request Object
	 * @param  {Object} res HTTP(S) response Object
	 * @return {Object}     TurtleIO instance
	 */
	destroy : function ( req, res ) {
		var domain = req.parsed.host.isDomain() && !req.parsed.host.isIP() ? req.parsed.host : undefined,
		    secure = ( req.parsed.protocol === "https:" ),
		    sid    = req.cookies[this.server.config.session.id];

		if ( sid ) {
			this.server.cookie.expire( res, this.server.config.session.id, domain, secure, "/" );
			delete this.server.sessions[sid];
		}

		return this.server;
	},

	/**
	 * Gets a session
	 *
	 * @method get
	 * @param  {Object} req HTTP(S) request Object
	 * @param  {Object} res HTTP(S) response Object
	 * @return {Mixed}      Session or undefined
	 */
	get : function ( req, res ) {
		var sid  = req.cookies[this.server.config.session.id],
		    sesh = null;

		if ( sid !== undefined ) {
			sesh = this.server.sessions[sid] || null;

			if ( sesh !== null ) {
				if ( sesh._timestamp.diff( moment().unix() ) > 1 ) {
					this.save( req, res );
				}
			}
			else {
				this.destroy( req, res );
			}
		}

		return sesh;
	},

	/**
	 * Saves a session
	 *
	 * @method save
	 * @param  {Object} req HTTP(S) request Object
	 * @param  {Object} res HTTP(S) response Object
	 * @return {Object}     TurtleIO instance
	 */
	save : function ( req, res ) {
		var expires = this.server.session.expires,
		    domain  = req.parsed.host.isDomain() && !req.parsed.host.isIP() ? req.parsed.host : undefined,
		    secure  = ( req.parsed.protocol === "https:" ),
		    sid     = req.cookies[this.server.config.session.id];

		if ( sid ) {
			this.server.sessions[sid]._timestamp = moment().unix();
			this.server.cookie.set( res, this.server.config.session.id, sid, expires, domain, secure, "/" );
		}

		return this.server;
	},

	// Transformed `config.session.valid` for $.cookie{}
	expires : "",

	// Determines if a session has expired
	maxDiff : 0,

	// Set & unset from `start()` & `stop()`
	server : null
};
