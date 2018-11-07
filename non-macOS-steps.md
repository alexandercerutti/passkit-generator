# Non-macOS-steps

This is a branch file that starts from the [Certificate paragraph](./README.md#certificates) and is made for developers that does not have access to macOS or are very very enthusiast of terminal (so its still valid for macOS).

I have to use these steps to work under WSL (Windows Subsystem for Linux), or Bash on Windows. I've not tested them under OpenSSL for Windows, but they might work at the same way. The only thing you'll still need over the certificates, are an Wallet-ready iOS App (and so an iPhone) or a way to pass it.
To test it, I use my [Passkit-sample-client](https://github.com/alexandercerutti/passkit-sample-client), an really basic iOS App which requires just few informations and will show you the generated pass. Or you can use like Telegram, save your generated pass in your "Saved Messages" and then open it from the iPhone. Your choice.

But let's not talk anymore about testing and let's go with the steps to follow. **It will still require OpenSSL installed**. We are going to use it in a massive way.


1. Create a new pass type identifier and provide it with a Name and a reverse-domain bundle id (starting with "pass."). You will put this identifier as value for `passTypeIdentifier` in `pass.json` file.

2. Confirm and register the new identifier.

3. Go back to the pass type identifiers, click on your new pass id and Edit it.

4. Click "Create certificates" and then "Continue". You won't need to follow the written steps as they are for "Keychain Access" on macOS. Just to let you know, you are required to provide Apple a CSR (Certificate Signing Request). To provide them, you have first to generate a private key.

5. Open your terminal, and **place yourself in a good directory for you**. It may be the `certs/` folder in your application root.

6. Generate a private key with a name you like.

	```sh
	# Generate a key:
	$ openssl genrsa -out <your-key-name>.key 2048
	```

7. Generate a CSR using your private key. Usually it should have a `.csr` extension, but there is no difference: .csr is a ASN.1 Base64 encoded text. Therefor it can have any extension you want.

	```sh
	# Create a signing request
	$ openssl req -new -key <your-key-name>.key -out csr.certSigningRequest
	```

	You will be prompted to insert some informations. You'll have to insert Apple CA's informations, like below (**bold ones**). If none, press Enter to skip. After the email address, you won't need any further informations. So press Enter until you won't finish.

	<hr>

	Country Name (2 letter code) [AU]: **US**

	State or Province Name [Some-State]: **United States**

	Locality Name []:

	Organization Name [Internet Widgits Pty Ltd]: **Apple Inc.**

	Organizational Unit Name []: **Apple Worldwide Developer Relations**

	Common Name []: **Apple Worldwide Developer Relations Certification Authority**

	Email Address []: **your-email**

	<hr>

	If you are curious about how a CSR is composed, use this command:

	```sh
	# Optional, just for curious people
	$ openssl asn1parse -i -in csr.certSigningRequest
	```
	<hr>

8. Take your `csr.certSigningRequest` and upload it to APP (Apple Provisioning Portal) at step 4. Once processed, it will give you a certificate `.cer`.

9. Let's convert it to `.pem` (from a DER encoded to PEM Base64 encoded)

	```sh
	# .cer to .pem
	$ openssl x509 -inform DER -outform PEM -in pass-test.cer -out signerCert.pem
	```

10. Take `signerCert.pem` and save it. You'll use it in your application.

11. Convert your private key `.key` to a `.pem` base64 and save your key. You'll be using it in your application.

	```sh
	# .key to .pem
	$ openssl rsa -in <your-key-name>.key -outform PEM -out passkey.pem
	```

12. Execute Step 10 also for `AppleWWDRCA.cer` you've download from [Apple PKI](https://www.apple.com/certificateauthority/) and save it somewhere (over the rainbow... 🌈).

13. And you are done. 🎉 Now try to create your first pass! My suggestion is to keep anyway the `.key` file somewhere as backup (this time not over the rainbow). You can always download `.cer` file from APP, but you cannot generate back your private key.
