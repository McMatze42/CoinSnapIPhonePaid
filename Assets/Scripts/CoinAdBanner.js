#pragma strict

public var showOnTop:boolean = true; // top or buttom
public var dontDestroy:boolean = false; // keep for next screen or not

#if UNITY_IPHONE
private var banner:ADBannerView;

function Start () 
{
	if (dontDestroy)
	{
		GameObject.DontDestroyOnLoad(gameObject);
	}
	
	banner = new ADBannerView();
	banner.autoSize = true;
	banner.autoPosition = showOnTop ? ADPosition.Top : ADPosition.Bottom;
	
	while (!banner.loaded && banner.error == null)
	{
		yield;
	}
	
	if (banner.error == null)
	{
		banner.Show();
	}
	else
	{
		banner = null;
	}
}

#endif
