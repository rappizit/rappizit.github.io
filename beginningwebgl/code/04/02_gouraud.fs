<script id="shader-fs" type="x-shader/x-fragment">
	varying highp vec3 vColor;
	
	void main(void) {   
    	gl_FragColor = vec4(vColor, 1.0);
	}
</script>