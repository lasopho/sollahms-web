import math
def inverse(E,N):
 a=6378137.;e2=.0066943799901413165;k=.9996;x=E-500000;y=N-10000000;M=y/k;mu=M/(a*(1-e2/4-3*e2**2/64-5*e2**3/256));e1=(1-math.sqrt(1-e2))/(1+math.sqrt(1-e2));fp=mu+(3*e1/2-27*e1**3/32)*math.sin(2*mu)+(21*e1**2/16-55*e1**4/32)*math.sin(4*mu)+(151*e1**3/96)*math.sin(6*mu)+(1097*e1**4/512)*math.sin(8*mu)
 ep=e2/(1-e2);C=ep*math.cos(fp)**2;T=math.tan(fp)**2;Rn=a*(1-e2)/(1-e2*math.sin(fp)**2)**1.5;Nn=a/math.sqrt(1-e2*math.sin(fp)**2);D=x/(Nn*k)
 lat=fp-(Nn*math.tan(fp)/Rn)*(D**2/2-(5+3*T+10*C-4*C*C-9*ep)*D**4/24+(61+90*T+298*C+45*T*T-252*ep-3*C*C)*D**6/720)
 lon=math.radians(-69)+(D-(1+2*T+C)*D**3/6+(5-2*C+28*T-3*C*C+8*ep+24*T*T)*D**5/120)/math.cos(fp)
 return math.degrees(lat),math.degrees(lon)
for x in [(351457,6293750),(350720,6301060),(350610,6300884),(355765,6284629)]:print(x,inverse(*x))
