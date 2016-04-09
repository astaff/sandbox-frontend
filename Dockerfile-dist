#
# Container for OT.one labware 
#
# Expects the following environment variables:
# CROSSBAR_HOST
# CROSSBAR_PORT
#
FROM common

COPY root.tar.gz root.tar.gz
RUN tar -xvzf root.tar.gz -C / && rm root.tar.gz
WORKDIR /home/sandbox-frontend-master

ENTRYPOINT ["python3", "/home/sandbox-frontend-master/app.py"]
