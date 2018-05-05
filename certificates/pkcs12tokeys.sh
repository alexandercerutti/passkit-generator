#!/bin/bash

# This script is just a shortcut to extract public and private keys from pkcs#12 key file

# For the ones who never used BASH, remember to not put spaces
# in variable=value or it won't work.

# This is the pass used on .p12 file exported from the keychain
passToExtract="alpaca2018"
# This is the secret to encrypt the key (second command) - use complex secret on production
secret="123456"
# This is the name of the .p12 file exported from the keychain.
# You can put also paths but remember the starting point is the "certificates/" folder
# Example : the file is on the parent folder
# baseFile="../pass-exported.p12"
baseFile="passCertificate-exported.p12"

cd "$(dirname "$0")"

# Certificate Key in .pem format
sudo openssl pkcs12 -in ${baseFile} -clcerts -nokeys -out passcertificate.pem -passin pass:${passToExtract}

# Key in .pem format
sudo openssl pkcs12 -in ${baseFile} -nocerts -out passkey.pem -passin pass:$passToExtract -passout pass:${secret}

