#pragma strict

var mousepowerx:float = 4.0;
var mousepowery:float = 4.0;

var swipepowerx: float = 0.1;
var swipepowery: float = 0.08;
  
var levelMalus: float = 5.0;

private var forcex:float = 0.0;
private var forcey:float = 0.0;
private var forcez:float = 0.0;
private var floorTag = "Floor";
private var wallTag = "Wall";
private var CoinSnapLogic: GameObject;
private var human: boolean = true;
private var nonHumanWaitTime: int;
private var nextThrowTime : float;
private var coinIsReady: boolean = false;
private var coinIsActive: boolean = false;
private var deltatime: float = Time.deltaTime;
private var touchFactor: float = 15.0;
private var speed: float = 0.1;
private var horizontalLimit: float = 2.5;
private var verticalLimit: float = 1.5;
private var dragSpeed: float = 0.0001;
private var cachedTransform: Transform;
private var startingPos: Vector3;
private var startPosTouch:Vector2;
private var startTimeTouch: float;
private var upPosTouch: Vector2;
private var upTimeTouch: float;
private var deltaPosition: Vector2;
 
// Sounds
private var audioSnap: AudioSource;
private var audioRoll: AudioSource;

function Start () {

	rigidbody.useGravity = false;
	nonHumanWaitTime = Random.Range(1, 3);
	nextThrowTime = Time.time + nonHumanWaitTime;
	var aSources = GetComponents(AudioSource);
    audioSnap = aSources[0] as AudioSource;
    audioRoll = aSources[1] as AudioSource;
    CoinSnapLogic = GameObject.FindGameObjectWithTag("fsm");
    
    cachedTransform = transform;
    startingPos = cachedTransform.position;
}

function Update () {

	if (human)
	{
		CoinSnapLogic = GameObject.FindGameObjectWithTag("fsm");
		if (!coinIsReady)
		{
			CoinSnapLogic.SendMessage("coinIsReady");
			coinIsReady = true;				
		}
		
		#if !UNITY_IPHONE
		if (Input.GetMouseButtonDown(0))
		{
			forcex = mousepowerx * Input.GetAxis("Mouse X")/Time.deltaTime;
			forcey = mousepowery * Input.GetAxis("Mouse Y")/Time.deltaTime;
			forcez = 1.0;
			// only forward and min 4.0
			if (forcey < 4.0) forcey = 4.0;
			// max forward drive
			if (forcey > 10.0)
			{ 
				if (forcey >= 16.0) forcey -= 8.0;
				if ((forcey >= 14.0) && (forcey < 16.0)) forcey -= 6.0;
				if ((forcey >= 12.0) && (forcey < 14.0)) forcey -= 4.0;
			}
			
			if (!coinIsActive)
			{
				CoinSnapLogic.SendMessage("setStateCoinIsActive");
				coinIsActive = true;
				audioSnap.Play();
			}
		}
		#else
		if (Input.touchCount > 0)
		{
			var touch:Touch = Input.GetTouch(0);
			
			if (touch.phase == TouchPhase.Began)
			{
				startTimeTouch = Time.time;
				startPosTouch = touch.position;	
			}
			if (touch.phase == TouchPhase.Ended)
			{
				// Y-Pos
				deltatime = Time.deltaTime;
				upPosTouch = touch.position;
				upTimeTouch = Time.time;
				var deltaYtouch = upPosTouch.y - startPosTouch.y;
				var deltaYtime = (upTimeTouch - startTimeTouch) * 1000;
				forcey = (deltaYtouch / deltaYtime) + 4.0; // min 4.0
				// X-Pos
				var touchPositionDelta: Vector2 = touch.deltaPosition;
				forcex = (swipepowerx*touchPositionDelta.x/deltatime) / touchFactor;
				forcez = 1.0;
				// max forward drive
				if (forcey > 20.0) forcey /= 10.0;
				if (!coinIsActive)
				{
					CoinSnapLogic.SendMessage("setStateCoinIsActive");
					coinIsActive = true;
					audioSnap.Play();
				}
			}
		}
		#endif
	}
	else
	{
		if (Time.time > nextThrowTime)
		{
			CoinSnapLogic = GameObject.FindGameObjectWithTag("fsm");
			if (!coinIsReady)
			{
				CoinSnapLogic.SendMessage("coinIsReady");
				coinIsReady = true;				
			}
			
			var maxYRangeVon: float = 5.0 - levelMalus;
			var maxYRangebis: float = 7.0 + levelMalus;
			
			forcex = Random.Range(0.0, 0.9);
			forcey = Random.Range(maxYRangeVon, maxYRangebis);
			forcez = Random.Range(0.5, 1.0);
			
			// only forward and min 5.0
			if (forcey < 5.0) forcey = 5.0;
			
			if (!coinIsActive)
			{
				CoinSnapLogic.SendMessage("setStateCoinIsActive");
				coinIsActive = true;	
				audioSnap.Play();
			}
		}
	}
}

function FixedUpdate()
{
	if (forcey >= 4.0)
	{
		if (rigidbody.useGravity == false)
		{
			rigidbody.useGravity = true;
			
			if (forcex > 2.0) forcex = 1.0; // not to far left or right
			if (forcex < -2.0) forcex = -1.0; // not to far left or right
			
			//Debug.Log("forcey: " + forcey);
			
			rigidbody.AddForce(forcex, forcez, forcey);
			rigidbody.AddTorque(100, 0, 0, ForceMode.Impulse);
		}
	}
	else
	{
		if (human)
		{
			if ((Input.touchCount > 0) && (Input.GetTouch(0).phase == TouchPhase.Moved))
			{
				deltaPosition = Input.GetTouch(0).deltaPosition;
				if (startingPos.y > transform.position.y)
				{
					startPosTouch = Input.GetTouch(0).position;
					startTimeTouch = Time.time;	
				}
				dragCoin(deltaPosition);
			}
		}
	}
}

function OnCollisionEnter(collider:Collision)
{
	if ((collider.gameObject.tag == floorTag) || (collider.gameObject.tag == wallTag))
	{
		if (collider.gameObject.tag == wallTag)
		{
			// don't stay inside the wall!
			transform.position = new Vector3(transform.position.x, transform.position.y, 2.4);
			rigidbody.mass = 0.2;
		}
		audioRoll.Play();	
	} 
}

function dragCoin(daltaPosition: Vector2)
{
	var xValue: float = Mathf.Clamp((deltaPosition.x * dragSpeed) + cachedTransform.position.x,	startingPos.x - horizontalLimit, startingPos.x + horizontalLimit);
	var yValue: float = Mathf.Clamp((deltaPosition.y * dragSpeed) + cachedTransform.position.y,	startingPos.y - verticalLimit, startingPos.y + verticalLimit);
	var zValue: float = cachedTransform.position.z;
	cachedTransform.position = new Vector3(xValue, yValue, zValue);
} 

function setHumanTrue()
{
	human = true;
}

function setHumanFalse()
{
	human = false;
}

function increseLevelMalus()
{
	levelMalus -= 0.5;	
}
