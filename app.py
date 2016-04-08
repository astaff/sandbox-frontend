import os, datetime

from flask import Flask, request # Retrieve Flask, our framework
from flask import render_template

app = Flask(__name__)   # create our flask app

# this is our main page
@app.route("/")
def index():
	return render_template("sandbox.html")


@app.route("/deck")
def sandbox():
	return render_template("deck.html")

@app.route("/data")
def data():
	return render_template("data.html")


@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404


# start the webserver
if __name__ == "__main__":
	app.debug = True
	
	port = int(os.environ.get('PORT', 5000)) # locally PORT 5000
	app.run(host='0.0.0.0', port=port)



	