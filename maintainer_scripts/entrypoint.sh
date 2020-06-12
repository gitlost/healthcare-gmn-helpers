#!/bin/sh

if [ $# -ne 0 ]; then
  exec $@
fi

set -e

# Build JS
cd /srv/js
jest
rm -rf docs
jsdoc -d docs -c jsdoc.conf healthcaregmn.js

# Build Java
cd /srv/java
javac -encoding UTF-8 org/gs1/HealthcareGMN.java
javac -encoding UTF-8 -cp .:/usr/share/java/junit4.jar HealthcareGMNTests.java
java -cp .:/usr/share/java/junit4.jar org.junit.runner.JUnitCore HealthcareGMNTests
jar -cvf HealthcareGMN.jar org/gs1/*.class
rm -rf docs
javadoc -d docs -notimestamp org.gs1

# Build C#
cd /srv/cs
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
export HOME=/tmp
dotnet build HealthcareGMN/HealthcareGMN.csproj
dotnet test HealthcareGMNTests/HealthcareGMNTests.csproj
dotnet pack -c Release -o app HealthcareGMN/HealthcareGMN.csproj
cp app/HealthcareGMN.*.nupkg .

