# sandbox-frontend
Initial SASS and Python Integration

* Download code.
* Open code directory in Terminal console.
* Create Virtualenv (only needs to be run once).

		virtualenv venv

* Initial PIP requirements install / Or when you need to update Python modules after modifying requirements.txt

		. runpip

	The **runpip** file is a helper file and has the following commands

		. venv/bin/activate
		pip install -r requirements.txt

* Start the Server & Activate the Virtualenv if not already active.

		. start

	The **start** file has the following commands

		. venv/bin/activate
		foreman start

* If successful you can navigate to <a href='http://localhost:5000'>http://localhost:5000</a>.

=======

