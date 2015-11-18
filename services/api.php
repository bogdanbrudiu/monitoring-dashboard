<?php

 	require_once("Rest.inc.php");

	class API extends REST {
	

		private $DB_SERVER = "127.0.0.1";
		private $DB_USER = "bogdanbrudiu";
		private $SB_PASSWORD = "";
		private $DB_NAME = "monitoring_dashboard";
		private $DB_PORT = 3306;


		private $mysqli = NULL;
		public function __construct(){
			parent::__construct();				// Init parent contructor
			/*
			if($OPENSHIFT_MYSQL_DB_HOST!=null){
					$this->DB_SERVER = $OPENSHIFT_MYSQL_DB_HOST;
					$this->DB_USER = "adminexMR6vD";
					$this->SB_PASSWORD = "iRy1WzxnuTv1";
					$this->DB_NAME = "monitoringdashboard";
					$this->DB_PORT = $OPENSHIFT_MYSQL_DB_PORT;
			}*/

			$this->dbConnect();					// Initiate Database connection
		}
		
		/*
		 *  Connect to Database
		*/
		private function dbConnect(){
			$this->mysqli = new mysqli($this->DB_SERVER, $this->DB_USER, $this->DB_PASSWORD, $this->DB_NAME, $this->DB_PORT);
		}
		
		/*
		 * Dynmically call the method based on the query string
		 */
		public function processApi(){
			$func = strtolower(trim(str_replace("/","",$_REQUEST['x'])));
			if((int)method_exists($this,$func) > 0)
				$this->$func();
			else
				$this->response('',404); // If the method not exist with in this class "Page not found".
		}
				
	
		private function allentries(){	
			if($this->get_request_method() != "GET"){
				$this->response('',406);
			}
			
			$deviceKey = $this->_request['deviceKey'];
			
			if($deviceKey != ''){
				$query="SELECT * FROM entries d where d.deviceKey = '$deviceKey' order by d.timestamp desc";
			}else{
				$query="SELECT * FROM entries d order by d.timestamp desc";
			}
			$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);

			if($r->num_rows > 0){
				$result = array();
				while($row = $r->fetch_assoc()){
					$result[] = $row;
				}
				$this->response($this->json($result), 200); // send user details
			}
			$this->response('',204);	// If no records "No Content" status
		}
		private function entries(){	

			if($this->get_request_method() != "GET"){
				$this->response('',406);
			}

			$query="SELECT t.*, d.friendlyName FROM (SELECT * FROM entries d order by d.timestamp desc) t LEFT OUTER JOIN devices d on t.deviceKey=d.deviceKey group by t.deviceKey order by t.deviceKey";
			$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
			if($r->num_rows > 0){
				$result = array();
				while($row = $r->fetch_assoc()){
					$result[] = $row;
				}
				$this->response($this->json($result), 200); // send user details
			}
			$this->response('',204);	// If no records "No Content" status
		}
		private function entry(){	
			if($this->get_request_method() != "GET"){
				$this->response('',406);
			}
			$id = (int)$this->_request['id'];
			if($id > 0){	
				$query="SELECT distinct * FROM entries d where d.id=$id";
				$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
				if($r->num_rows > 0) {
					$result = $r->fetch_assoc();	
					$this->response($this->json($result), 200); // send user details
				}
			}
			$this->response('',204);	// If no records "No Content" status
		}
		
		private function insertEntry(){
			if($this->get_request_method() != "POST"){
				$this->response('',406);
			}

			$entry = json_decode(file_get_contents("php://input"),true);
			$column_names = array('deviceKey', 'state', 'version', 'battery', 'rssi');
			$keys = array_keys($entry);
			$columns = '';
			$values = '';
			foreach($column_names as $desired_key){ // Check the record received. If blank insert blank into the array.
			   if(!in_array($desired_key, $keys)) {
			   		$$desired_key = '';
				}else{
					$$desired_key = $entry[$desired_key];
				}
				$columns = $columns.$desired_key.',';
				$values = $values."'".$$desired_key."',";
			}
			$query = "INSERT INTO entries(".trim($columns,',').") VALUES(".trim($values,',').")";
			if(!empty($entry)){
				$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
				$success = array('status' => "Success", "msg" => "Record Created Successfully.", "data" => $entry);
				$this->response($this->json($success),200);
			}else
				$this->response('',204);	//"No Content" status
		}
		private function updateEntry(){
			if($this->get_request_method() != "POST"){
				$this->response('',406);
			}
			$entry = json_decode(file_get_contents("php://input"),true);
			$id = (int)$entry['id'];
			$column_names = array('deviceKey', 'state', 'version', 'battery', 'rssi');
			$keys = array_keys($entry['entry']);
			$columns = '';
			$values = '';
			foreach($column_names as $desired_key){ // Check the record received. If key does not exist, insert blank into the array.
			   if(!in_array($desired_key, $keys)) {
			   		$$desired_key = '';
				}else{
					$$desired_key = $entry['entry'][$desired_key];
				}
				$columns = $columns.$desired_key."='".$$desired_key."',";
			}
			$query = "UPDATE entries SET ".trim($columns,',')." WHERE id=$id";
			if(!empty(entry)){
				$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
				$success = array('status' => "Success", "msg" => "Record ".$id." Updated Successfully.", "data" => $entry);
				$this->response($this->json($success),200);
			}else
				$this->response('',204);	// "No Content" status
		}
		
		private function deleteEntry(){
			if($this->get_request_method() != "DELETE"){
				$this->response('',406);
			}
			$id = (int)$this->_request['id'];
			if($id > 0){				
				$query="DELETE FROM entries WHERE id = $id";
				$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
				$success = array('status' => "Success", "msg" => "Successfully deleted one record.");
				$this->response($this->json($success),200);
			}else
				$this->response('',204);	// If no records "No Content" status
		}
		
		
		
		
		
		private function devices(){	
			if($this->get_request_method() != "GET"){
				$this->response('',406);
			}
			$query="select * FROM ((SELECT * FROM devices) UNION (SELECT deviceKey,'' as friendlyName FROM entries e GROUP BY e.deviceKey)) as t group by t.deviceKey order by t.deviceKey";
			$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);

			if($r->num_rows > 0){
				$result = array();
				while($row = $r->fetch_assoc()){
					$result[] = $row;
				}
				$this->response($this->json($result), 200); // send user details
			}
			$this->response('',204);	// If no records "No Content" status
		}
		
		private function deleteDevice(){
			if($this->get_request_method() != "DELETE"){
				$this->response('',406);
			}
			$deviceKey = $this->_request['deviceKey'];
			if($id > 0){				
				$query="DELETE FROM entries WHERE deviceKey = $deviceKey";
				$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
				$query="DELETE FROM devices WHERE deviceKey = $deviceKey";
				$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
				$success = array('status' => "Success", "msg" => "Successfully deleted device.");
				$this->response($this->json($success),200);
			}else
				$this->response('',204);	// If no records "No Content" status
		}
		private function insertOrUpdateDevice(){
			if($this->get_request_method() != "POST"){
				$this->response('',406);
			}

			$entry = json_decode(file_get_contents("php://input"),true);
			$column_names = array('deviceKey', 'friendlyName');
			$update_column_names = array('friendlyName');
			$keys = array_keys($entry);
			$columns = '';
			$values = '';
			$update = '';
			foreach($column_names as $desired_key){ // Check the record received. If blank insert blank into the array.
			   	if(!in_array($desired_key, $keys)) {
			   		$$desired_key = '';
				}else{
					$$desired_key = $entry[$desired_key];
				}
				$columns = $columns.$desired_key.',';
				$values = $values."'".$$desired_key."',";
				if(in_array($desired_key, $update_column_names)){
					$update = $update.$desired_key."='".$$desired_key."',";
				}
			}
			$query = "INSERT INTO devices(".trim($columns,',').") VALUES(".trim($values,',').") ON DUPLICATE KEY UPDATE ".trim($update,',');
			if(!empty($entry)){
				$r = $this->mysqli->query($query) or die($query." ".$this->mysqli->error.__LINE__);
				$success = array('status' => "Success", "msg" => "Record Created Successfully.", "data" => $entry);
				$this->response($this->json($success),200);
			}else
				$this->response('',204);	//"No Content" status
		}
	
		
		/*
		 *	Encode array into JSON
		*/
		private function json($data){
			if(is_array($data)){
				return json_encode($data);
			}
		}
	}
	
	// Initiiate Library
	
	$api = new API;
	$api->processApi();
?>