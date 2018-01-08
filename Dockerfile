FROM ubuntu:16.04

RUN apt-get update \
&& apt-get install -y curl \
&& curl -sL https://deb.nodesource.com/setup_8.x | bash - \
&& curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
&& echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
&& apt-get update \
&& apt-get install -y nodejs \
&& apt-get install -y make \
&& apt-get install yarn

# Create directory
RUN mkdir -p /var/app
WORKDIR /var/app

# Install packages
RUN npm install -g npm-check-updates \
&& npm install nodemon -g

# Install app dependencies
COPY . /var/app