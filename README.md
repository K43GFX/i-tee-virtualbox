# i-tee-virtualbox v0.0.1

VirtualBox API provider for I-Tee

- [Machine](#machine)
	- [Halt and delete machine](#halt-and-delete-machine)
	- [List machines](#list-machines)
	- [Retrieve information about machine](#retrieve-information-about-machine)
	- [Create machine from given image](#create-machine-from-given-image)
	- [Modify state of existing machine](#modify-state-of-existing-machine)
	
- [Snapshot](#snapshot)
	- [Delete snapshot](#delete-snapshot)
	- [Create new snapshot](#create-new-snapshot)
	


# Machine

## Halt and delete machine



	DELETE /machine/:machine


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| machine			| string			|  <p>Machine name</p>							|

## List machines



	GET /machine


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| running			| string			| **optional** <p>Query flag to only include running machines</p>							|
| detailed			| string			| **optional** <p>Query flag to include details in response</p>							|

## Retrieve information about machine



	GET /machine/:machine


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| machine			| string			|  <p>Machine name</p>							|

## Create machine from given image



	POST /machine/:machine


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| machine			| string			|  <p>Machine name</p>							|
| image			| string			|  <p>Template name</p>							|
| network			| string[]			| **optional** <p>Networks to be assigned to NIC-s</p>							|
| dmi			| object			| **optional** <p>DMI properties in <code>dmidecode</code> format</p>							|
| rdp			| object			| **optional** 							|
| rdp.username			| string			|  <p>RDP username</p>							|
| rdp.password			| string			|  <p>RDP password</p>							|
| state			| string			| **optional** <p>State of the machine</p>							|

## Modify state of existing machine



	PUT /machine/:machine


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| machine			| string			|  <p>Machine name</p>							|
| state			| string			| **optional** <p>Requested machine state</p>							|
| rdp			| object			| **optional** 							|
| rdp.enabled			| boolean			| **optional** <p>RDP state</p>							|

# Snapshot

## Delete snapshot



	DELETE /machine/:machine/snapshot/:snapshot


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| machine			| string			|  <p>Machine name</p>							|
| snapshot			| string			|  <p>Snapshot name</p>							|

## Create new snapshot



	POST /machine/:machine/snapshot/:snapshot


### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| machine			| object			|  <p>Machine name</p>							|
| snapshot			| object			|  <p>Snapshot name</p>							|


