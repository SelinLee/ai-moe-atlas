"""Deep Whale Maid v0.2.0: static full-body procedural interpretation.
CC BY-NC-SA 4.0. Original character: 上善无形; maid design: ZipZipPipe;
published adaptation: Small-tailqwq; reconstruction: AI Moe Atlas (AI-assisted).
Preserves the approved v0.1 face/head. Legs, stockings, shoes, side and back
are inferred additions, not canonical reference details. No rig or animation.
Run in Blender 4.3+: blender --background --python this-file -- --render-views
Review output defaults to artifacts/models/deep-whale-maid/v0.2.0; override
ATLAS_MODEL_REVIEW_DIR to keep renders/source in a separate local directory.
"""
import bpy, math, os, sys, json
from math import sin,cos,pi,sqrt
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
OUT=os.path.join(ROOT,'public/models/deep-whale-maid/v0.2.0')
REVIEW=os.environ.get('ATLAS_MODEL_REVIEW_DIR',os.path.join(ROOT,'artifacts/models/deep-whale-maid/v0.2.0'))
os.makedirs(OUT,exist_ok=True);os.makedirs(REVIEW,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for m in list(bpy.data.materials):bpy.data.materials.remove(m)
def mat(n,c,r=.65,metal=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=r;p.inputs['Metallic'].default_value=metal;return m
skin=mat('Porcelain skin',(.98,.69,.59));white=mat('Ivory cotton',(.95,.92,.89));navy=mat('Midnight uniform',(.038,.057,.14));hair=mat('Indigo hair',(.032,.055,.16));tips=mat('Blue tips',(.15,.35,.61));shadow=mat('Indigo shadow',(.047,.078,.19));blue=mat('Ocean ribbon',(.11,.33,.62));gold=mat('Gold piping',(.57,.34,.095),.38,.55);black=mat('Ink lashes',(.011,.015,.038));mouth=mat('Mouth',(.29,.045,.064));tongue=mat('Tongue',(.96,.24,.29));blush=mat('Rosy cheeks',(.98,.51,.46));iris=mat('Sapphire iris',(.039,.16,.37));aqua=mat('Aqua iris',(.12,.57,.81));pupil=mat('Deep pupils',(.018,.042,.096));shine=mat('Catchlights',(1,1,1),.2);base=mat('Plinth',(.14,.27,.38));cream=mat('Apron shadows',(.76,.82,.89))
hairgrad=mat('Indigo blue gradient',(.13,.25,.48));p=hairgrad.node_tree.nodes.get('Principled BSDF');v=hairgrad.node_tree.nodes.new('ShaderNodeVertexColor');v.layer_name='Color';hairgrad.node_tree.links.new(v.outputs['Color'],p.inputs['Base Color'])
model=[]
BODY_STAGE=False
def finish(o,n,m,sub=0):
 o.name=n;o.data.materials.append(m)
 if o.type=='MESH':
  for p in o.data.polygons:p.use_smooth=True
 if sub:q=o.modifiers.new('Smooth surface','SUBSURF');q.levels=sub;q.render_levels=sub
 model.append(o);return o

def uv(n,loc,scale,m,rot=(0,0,0),seg=40,rings=24):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc);o=bpy.context.object;o.scale=scale;o.rotation_euler=rot;return finish(o,n,m)

def mesh(n,vs,fs,m,sub=0):
 d=bpy.data.meshes.new(n);d.from_pydata(vs,[],fs);d.update();o=bpy.data.objects.new(n,d);bpy.context.collection.objects.link(o);return finish(o,n,m,sub)

def curve(n,pts,r,m):
 d=bpy.data.curves.new(n,'CURVE');d.dimensions='3D';d.resolution_u=(2 if len(pts)>12 else 6) if BODY_STAGE else 12;d.bevel_depth=r;d.bevel_resolution=2 if BODY_STAGE else 3;s=d.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for p,co in zip(s.bezier_points,pts):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(n,d);bpy.context.collection.objects.link(o);o.data.materials.append(m);model.append(o);return o

def bez(pts,t):
 if len(pts)==4:return Vector(pts[0])*(1-t)**3+Vector(pts[1])*3*(1-t)**2*t+Vector(pts[2])*3*(1-t)*t*t+Vector(pts[3])*t**3
 n=len(pts)-1;f=t*n;i=min(int(f),n-1);u=f-i;p1=Vector(pts[i]);p2=Vector(pts[i+1]);p0=Vector(pts[max(0,i-1)]);p3=Vector(pts[min(n,i+2)])
 return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)

def lock(n,pts,w,d,m=hairgrad,rings=32,sides=12,pointed=True):
 vs=[];fs=[]
 for i in range(rings+1):
  t=i/rings;c=bez(pts,t);tan=(bez(pts,min(1,t+.002))-bez(pts,max(0,t-.002))).normalized();u=tan.cross(Vector((0,-1,0))).normalized();v=u.cross(tan).normalized();r=(.58+.42*sin(pi*min(1,t*1.7)))*((1-t)**.4 if pointed else 1)
  if i==rings and pointed:r=.003
  for j in range(sides):a=j*2*pi/sides;vs.append(tuple(c+u*cos(a)*w*r+v*sin(a)*d*r))
 for i in range(rings):
  for j in range(sides):a=i*sides+j;b=i*sides+(j+1)%sides;fs.append((a,b,b+sides,a+sides))
 fs += [tuple(range(sides-1,-1,-1)),tuple(rings*sides+j for j in range(sides))];o=mesh(n,vs,fs,m,1)
 if m==hairgrad:
  col=o.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
  for i,e in enumerate(col.data):
   t=(i//sides)/rings;f=max(0,min(1,(t-.46)/.54))**1.2;a=(.028,.045,.145);b=(.065,.21,.46);e.color=(*(a[k]*(1-f)+b[k]*f for k in range(3)),1)
 return o

def bow(n,loc,size,m):
 x,y,z=loc
 for sign in [-1,1]:
  vs=[];fs=[];A=24;B=16
  # Pinched, broad-winged cloth loops with a sculpted central crease.
  for i in range(A+1):
   u=i/A;width=(.035+.145*sin(pi*u*.85))*size;xx=x+sign*(.025+.35*u)*size
   for j in range(B):
    a=j*2*pi/B;zz=z+width*cos(a);yy=y+.026*u*size+.055*sin(a)*size*sin(pi*u)**.6
    vs.append((xx,yy,zz))
  for i in range(A):
   for j in range(B):a=i*B+j;b=i*B+(j+1)%B;fs.append((a,b,b+B,a+B))
  fs.extend([tuple(range(B-1,-1,-1)),tuple(A*B+j for j in range(B))]);mesh(n+' sculpted ribbon loop',vs,fs,m,1)
  # Tapered ribbon ends are distinct cloth pieces.
  pts=[(x+sign*.05*size,y+.02*size,z-.025*size),(x+sign*.13*size,y+.015*size,z-.12*size),(x+sign*.16*size,y+.045*size,z-.27*size)]
  lock(n+' ribbon tail',pts,.068*size,.016*size,m,16,8,False)
 uv(n+' knot',(x,y-.06*size,z),(.065*size,.064*size,.085*size),m)

# Garment construction helpers. Every fold below is actual surface geometry.
def shell(n,profile,m,folds=0,amount=0,sides=96):
 vs=[];fs=[]
 for k,(z,rx,ry) in enumerate(profile):
  for j in range(sides):
   a=2*pi*j/sides;f=amount*sin(folds*a) if folds else 0
   vs.append(((rx+f)*sin(a),-(ry+f*.65)*cos(a),z+.014*sin(folds*a) if folds else z))
 for k in range(len(profile)-1):
  for j in range(sides):a=k*sides+j;b=k*sides+(j+1)%sides;fs.append((a,b,b+sides,a+sides))
 o=mesh(n,vs,fs,m,1);o.modifiers.new('Tailored fabric thickness','SOLIDIFY').thickness=.026;return o

def tube(n,pts,radii,m,sides=20,steps=48,flatten=1):
 vs=[];fs=[]
 for i in range(steps+1):
  t=i/steps;c=bez(pts,t);tangent=(bez(pts,min(1,t+.002))-bez(pts,max(0,t-.002))).normalized();u=tangent.cross(Vector((0,-1,0))).normalized()
  if u.length<.01:u=tangent.cross(Vector((1,0,0))).normalized()
  v=u.cross(tangent).normalized();p=t*(len(radii)-1);k=min(int(p),len(radii)-2);r=radii[k]*(1-(p-k))+radii[k+1]*(p-k)
  for j in range(sides):a=2*pi*j/sides;vs.append(tuple(c+u*cos(a)*r+v*sin(a)*r*flatten))
 for i in range(steps):
  for j in range(sides):a=i*sides+j;b=i*sides+(j+1)%sides;fs.append((a,b,b+sides,a+sides))
 fs.extend([tuple(range(sides-1,-1,-1)),tuple(steps*sides+j for j in range(sides))]);return mesh(n,vs,fs,m,1)

def ring(n,center,axis,radius,thickness,m,ellipse=1):
 c=Vector(center);t=Vector(axis).normalized();u=t.cross(Vector((0,-1,0))).normalized();v=u.cross(t).normalized()
 return curve(n,[tuple(c+u*cos(2*pi*j/48)*radius+v*sin(2*pi*j/48)*radius*ellipse) for j in range(49)],thickness,m)

def solid_patch(n,points,m,thick=.016,sub=1):
 o=mesh(n,points,[tuple(range(len(points)))],m,sub);o.modifiers.new('Cloth depth','SOLIDIFY').thickness=thick;return o

# Head and expression are copied without redesign from the approved v0.1 builder.
# Relocate its complete head assembly while keeping facial proportions unchanged.
head_start=len(model)
# Stage 2. Sculpted pear-shaped face with volume-following anime eye patches.
vs=[];fs=[];N=64;M=40
for i in range(M+1):
 t=pi*i/M;z=2.135+.78*cos(t);chin=1-.10*max(0,-cos(t))
 for j in range(N):a=j*2*pi/N;vs.append((.805*sin(t)*sin(a)*chin,-.535*sin(t)*cos(a),z))
for i in range(M):
 for j in range(N):a=i*N+j;b=i*N+(j+1)%N;fs.append((a,b,b+N,a+N))
mesh('Sculpted face',vs,fs,skin,1)
def fy(x,z,o=0):return -.535*sqrt(max(.07,1-(x/.805)**2-((z-2.135)/.78)**2))-o

def patch(n,cx,cz,rx,rz,m,o=.02):
 vs=[(cx,fy(cx,cz,o+.004),cz)];fs=[];S=48
 for k in range(1,9):
  r=k/8
  for j in range(S):a=2*pi*j/S;x=cx+rx*r*cos(a);z=cz+rz*r*sin(a);vs.append((x,fy(x,z,o+.004*(1-r*r)),z))
 for j in range(S):fs.append((0,1+j,1+(j+1)%S))
 for k in range(7):
  for j in range(S):a=1+k*S+j;b=1+k*S+(j+1)%S;fs.append((a,a+S,b+S,b))
 o=mesh(n,vs,fs,m);o['facePatch']=True;return o
for s in [-1,1]:
 x=s*.31;z=2.07
 for n,cx,cz,rx,rz,m,o in [('Eye white',x,z,.211,.212,white,.008),('Iris',x,z-.017,.151,.178,iris,.014),('Iris aqua',x,z-.084,.132,.091,aqua,.022),('Pupil',x,z+.005,.047,.100,pupil,.028),('Catchlight',x-s*.047,z+.086,.041,.050,shine,.036),('Eye glint',x+s*.076,z-.063,.019,.023,shine,.037)]:patch(n,cx,cz,rx,rz,m,o)
 pts=[]
 for j in range(15):a=.10*pi+j*.80*pi/14;xx=x+.218*cos(a);zz=z+.220*sin(a);pts.append((xx,fy(xx,zz,.043),zz))
 curve('Upper eyelash',pts,.022,black);curve('Lower eyelash',[(x-.17,fy(x-.17,z-.12,.025),z-.12),(x,fy(x,z-.203,.025),z-.203),(x+.16,fy(x+.16,z-.13,.025),z-.13)],.008,shadow)
 for j in range(3):
  xx=x+s*(.179-j*.022);zz=z+.132+j*.027;lock('Tapered outer lash',[(xx,fy(xx,zz,.05),zz),(xx+s*.055,fy(xx,zz,.05),zz+.005),(xx+s*(.10-j*.015),fy(xx,zz,.05),zz+.04)],.022,.012,black,8,6)
 curve('Eyebrow',[(x-s*.13,fy(x-s*.13,2.409,.025),2.409),(x,fy(x,2.434,.025),2.434),(x+s*.14,fy(x+s*.14,2.440,.025),2.440)],.014,hair)
 patch('Blush',s*.49,1.78,.12,.045,blush,.008)
 for j in range(3):curve('Blush stroke',[(s*(.44+j*.045),fy(s*(.44+j*.045),1.785,.029),1.785),(s*(.45+j*.045),fy(s*(.45+j*.045),1.746,.029),1.746)],.004,tongue)
uv('Small nose',(0,fy(0,1.89,.017),1.89),(.019,.017,.018),skin,seg=20,rings=14)
# The user's expression reference suggests a soft, confident closed omega smile.
smile=[(-.071,1.743),(-.046,1.721),(-.021,1.724),(0,1.738),(.021,1.724),(.046,1.721),(.071,1.743)]
curve('Closed omega smile',[(x,fy(x,z,.015),z) for x,z in smile],.0085,mouth)
# Stage 3. Scalp shell, separately shaped wavy locks, fin ears and sculpted bangs.
vs=[];fs=[]
for i in range(25):
 for j in range(64):a=2*pi*j/64;t=i/24*(1.95-.78*(1+cos(a))/2);vs.append((.847*sin(t)*sin(a),-.584*sin(t)*cos(a)+.025,2.19+.83*cos(t)))
for i in range(24):
 for j in range(64):a=i*64+j;b=i*64+(j+1)%64;fs.append((a,b,b+64,a+64))
mesh('Hair cap',vs,fs,hair,1)
for j in range(11):
 x=-.78+j*.156;y=.29+.24*(1-(x/.85)**2);lock('Back wave %02d'%j,[(x*.80,y*.6,2.54),(x,y,1.86),(x*1.08+.055*sin(j),y+.03,1.22),(x*1.09+.13*sin(j*1.9),y-.01,.69),(x*1.11+.17*sin(j*1.5),y-.07,.47)],.15,.12)
for s in [-1,1]:
 for j in range(4):
  x=.64+j*.075;y=-.04+j*.10;lock('Side wave',[(s*x,y,2.44-j*.09),(s*(.86+j*.04),y-.015,1.76),(s*(.71+j*.09),y-.025,1.08),(s*(.88+j*.10),y-.12,.68),(s*(.70+j*.13),y-.16,.48+j*.04)],.18-j*.013,.115)
 for m,off in [(hair,0),(cream,-.04)]:
  vs=[(s*.70,-.02+off,2.37),(s*.89,-.06+off,2.30),(s*1.08,-.025+off,2.16),(s*1.31,-.035+off,2.12),(s*1.18,-.09+off,2.02),(s*.94,-.14+off,2.055),(s*.76,-.13+off,2.14)]
  if m==cream:vs=[(x,y,z-.047) for x,y,z in vs]
  o=mesh('Whale fin ear',vs,[(0,1,2,3,4,5,6)],m,2);o.modifiers.new('Fin volume','SOLIDIFY').thickness=.075
lock('Central fringe',[(.02,-.37,2.91),(-.10,-.61,2.70),(.17,-.63,2.36),(.08,-.605,2.225)],.26,.09,hair,40)
for s in [-1,1]:
 lock('Parted bang',[(s*.20,-.35,2.91),(s*.48,-.60,2.68),(s*.42,-.60,2.40),(s*.31,-.62,2.29)],.225,.073,hair)
 lock('Outer swept bang',[(s*.40,-.22,2.80),(s*.72,-.44,2.46),(s*.69,-.47,1.87),(s*.55,-.47,1.78)],.22,.09,hair)
 for j in range(2):curve('Hair sculpt ridge',[(s*(.23+j*.09),-.479,2.85),(s*(.40+j*.09),-.649,2.63),(s*(.41+j*.07),-.646,2.44)],.008,shadow)
lock('Swept crown forelock',[(.04,-.02,2.995),(-.14,-.04,3.53),(-.73,-.08,3.36),(-.87,-.10,3.12)],.135,.06,hair,40)
# Stage 4. Pleated maid headband and side ribbon.
curve('Headband',[(.91*cos(j*pi/40),-.10,2.21+.89*sin(j*pi/40)) for j in range(41)],.057,white)
for j in range(15):
 a=.08*pi+j*.84*pi/14;c=Vector((.91*cos(a),-.055,2.21+.93*sin(a)));r=Vector((cos(a),0,sin(a)));t=Vector((-sin(a),0,cos(a)));vs=[]
 for k in range(7):
  f=k/6;w=.07+sin(pi*f)*.032
  for q in [-1,1]:p=c+r*(f*.215)+t*(q*w);p.y+=.025*cos(f*pi)+.022;vs.append(tuple(p))
 o=mesh('Pleated maid lace',vs,[(k*2,k*2+1,k*2+3,k*2+2) for k in range(6)],white,2);o.modifiers.new('Lace thickness','SOLIDIFY').thickness=.025;curve('Lace fold',[tuple(c+r*.035+Vector((0,-.027,0))),tuple(c+r*.15+Vector((0,-.016,0)))],.008,cream)
bow('Side ribbon',(.86,-.12,2.45),.56,blue)

for o in model[head_start:]:
 o.location.z+=1.65
 o['preserveApprovedHead']=True
 if o.type=='MESH' and (o.name.startswith('Side wave') or o.name.startswith('Back wave')):
  for v in o.data.vertices:
   v.co.y+=.28*max(0,min(1,(2.35-v.co.z)/1.6))
   v.co.z-=.24*max(0,min(1,(2.35-v.co.z)/1.6))

BODY_STAGE=True
# Fitted bodice and a properly flared, pleated bell skirt.
uv('Neck',(0,.015,2.93),(.19,.18,.28),skin)
shell('Fitted midnight maid bodice',[(2.14,.46,.29),(2.22,.47,.30),(2.43,.43,.285),(2.65,.49,.31),(2.79,.55,.29),(2.86,.43,.255),(2.91,.22,.19)],navy)
skirt_profile=[(2.20,.465,.31),(2.13,.52,.35),(2.03,.66,.45),(1.88,.83,.55),(1.70,1.00,.64),(1.52,1.13,.71),(1.37,1.19,.745)]
shell('Sixteen-fold bell skirt',skirt_profile,navy,16,.035,128)
# White petticoat: two continuous scalloped cloth layers beneath the navy hem.
for layer,z0 in enumerate([1.34,1.25]):
 vs=[];fs=[];N=160
 for k in range(5):
  t=k/4
  for j in range(N):
   a=2*pi*j/N;f=.034*sin(a*32);r=1.105+.055*t+f*t
   vs.append((r*sin(a),-(.70+.034*t+f*.6*t)*cos(a),z0+.055-.12*t+.024*cos(a*32)*t))
 for k in range(4):
  for j in range(N):a=k*N+j;b=k*N+(j+1)%N;fs.append((a,b,b+N,a+N))
 o=mesh('Scalloped petticoat layer %d'%layer,vs,fs,white,1);o.modifiers.new('Petticoat thickness','SOLIDIFY').thickness=.013
# Delicate gold edging follows the actual skirt silhouette.
for zz,rx,ry in [(1.405,1.185,.75),(1.46,1.16,.732)]:
 curve('Fine gold hem piping',[( (rx+.035*sin(16*a))*sin(a),-(ry+.023*sin(16*a))*cos(a),zz+.014*sin(16*a)) for a in [2*pi*j/192 for j in range(193)]],.007,gold)
shell('Waist belt',[(2.15,.477,.316),(2.21,.477,.316),(2.30,.458,.309),(2.32,.456,.306)],navy)
for x in [-.25,.25]:
 for z in [2.205,2.28]:uv('Waist brass button',(x,-.284,z),(.022,.015,.022),gold,seg=20,rings=12)

def skirt_y(x,z,offset=.02):
 for i in range(len(skirt_profile)-1):
  z1,rx1,ry1=skirt_profile[i];z2,rx2,ry2=skirt_profile[i+1]
  if z>=z2:
   t=max(0,min(1,(z1-z)/(z1-z2)));rx=rx1*(1-t)+rx2*t;ry=ry1*(1-t)+ry2*t;break
 else:rx,ry=1.20,.755
 a=math.asin(max(-.98,min(.98,x/rx)));f=.035*sin(16*a)
 return -(ry+.65*f)*sqrt(max(.05,1-(x/(rx+f))**2))-offset
# Bib is gathered cloth, not a flat decal.
vs=[];fs=[];A=16;B=24
for i in range(A+1):
 t=i/A;z=2.38+.48*t;w=.28+.075*sin(pi*t*.8)
 for j in range(B+1):
  u=2*j/B-1;x=w*u;y=-.322-.036*(1-u*u)-.012*cos(u*5*pi)*sin(pi*t)
  vs.append((x,y,z+.025*(1-u*u)*t))
for i in range(A):
 for j in range(B):a=i*(B+1)+j;fs.append((a,a+1,a+B+2,a+B+1))
o=mesh('Gathered white apron bib',vs,fs,white,1);o.modifiers.new('Bib cotton thickness','SOLIDIFY').thickness=.016
for x in [-.22,-.11,0,.11,.22]:curve('Bib sewn pleat',[(x,-.360,2.41),(x*1.06,-.363,2.61),(x*1.10,-.337,2.83)],.0045,cream)
for z in [2.48,2.61,2.74]:uv('Bib midnight button',(0,-.379,z),(.021,.012,.021),navy,seg=20,rings=12)
for s in [-1,1]:
 solid_patch('Pointed white collar',[(0,-.213,2.91),(s*.25,-.195,2.895),(s*.255,-.332,2.73),(s*.04,-.374,2.82)],white,.02,2)
 # Straps arc over the shoulder and end on the back belt.
 pts=[(s*.33,-.312,2.39),(s*.39,-.30,2.68),(s*.40,-.20,2.87),(s*.38,.10,2.86),(s*.34,.285,2.58),(s*.32,.304,2.28)]
 tube('White apron shoulder strap',pts,[.048,.052,.057,.049],white,12,42,.38)
 # Ruffled edges, each a continuous fluted strip.
 vs=[];fs=[];N=48
 for i in range(N+1):
  t=i/N;c=bez(pts,t);out=Vector((s,0,0));w=.065+.012*cos(t*22*pi)
  for k in range(3):
   q=k/2;p=c+out*(q*w);p.y+=.015*sin(t*22*pi)*q;p.z+=.010*cos(t*22*pi)*q;vs.append(tuple(p))
 for i in range(N):
  for k in range(2):a=i*3+k;fs.append((a,a+1,a+4,a+3))
 o=mesh('Shoulder apron ruffle',vs,fs,white,1);o.modifiers.new('Ruffle thickness','SOLIDIFY').thickness=.011
bow('Neck ribbon',(0,-.396,2.83),.68,navy)
for sz,m,y in [(.058,gold,-.466),(.042,blue,-.482)]:solid_patch('Neck blue diamond',[(0,y,2.83+sz),(-sz*.75,y,2.83),(0,y,2.83-sz),(sz*.75,y,2.83)],m,.014,0)

# Deep draped apron follows the bell silhouette with a curved hem and real ruffles.
A=28;B=32;vs=[];fs=[];apron_edges=[]
def apron_co(t,u):
 w=.405+.355*sin(pi*t*.88);x=w*u;z=2.155-.785*t+.17*t**4*u*u
 return Vector((x,skirt_y(x,z,.090)-.012*cos(u*5*pi)*sin(pi*t),z))
for i in range(A+1):
 for j in range(B+1):vs.append(tuple(apron_co(i/A,2*j/B-1)))
for i in range(A):
 for j in range(B):a=i*(B+1)+j;fs.append((a,a+1,a+B+2,a+B+1))
o=mesh('Sculpted front apron',vs,fs,white,1);o.modifiers.new('Apron fabric thickness','SOLIDIFY').thickness=.018
outline=[apron_co(i/50,-1) for i in range(51)]+[apron_co(1,-1+2*i/60) for i in range(1,61)]+[apron_co(1-i/50,1) for i in range(1,51)]
vs=[];fs=[];N=len(outline)
for i,c in enumerate(outline):
 tan=(outline[min(N-1,i+1)]-outline[max(0,i-1)]).normalized();out=Vector((tan.z,0,-tan.x)).normalized()
 for k in range(5):
  q=k/4;w=.078+.012*cos(i*2*pi/7);p=c+out*q*w;p.y-=.016+.027*sin(i*2*pi/7)*q;p.z+=.012*cos(i*2*pi/7)*q;vs.append(tuple(p))
for i in range(N-1):
 for k in range(4):a=i*5+k;fs.append((a,a+1,a+6,a+5))
o=mesh('Continuous fluted apron frill',vs,fs,white,1);o.modifiers.new('Apron frill thickness','SOLIDIFY').thickness=.012
curve('Apron seam',[(p.x,p.y-.018,p.z) for p in outline],.007,cream)
# A modeled small whale emblem and water spout sit low on the apron.
def emblem(n,coords,m):return solid_patch(n,[(x,skirt_y(x,z,.143),z) for x,z in coords],m,.008,1)
emblem('Whale emblem body',[(.17*cos(2*pi*j/48)-.015,1.585+.075*sin(2*pi*j/48)) for j in range(48)],navy)
emblem('Whale emblem tail',[(.10,1.56),(.18,1.62),(.18,1.70),(.215,1.665),(.27,1.69),(.26,1.63),(.20,1.59),(.16,1.56)],navy)
emblem('Whale emblem flipper',[(-.01,1.58),(.035,1.52),(.08,1.55),(.055,1.60)],blue)
uv('Whale emblem eye',(-.105,skirt_y(-.105,1.59,.162),1.60),(.010,.007,.010),white,seg=16,rings=10)
for x,z in [(-.02,1.738),(-.065,1.755),(.024,1.78)]:uv('Whale spout droplet',(x,skirt_y(x,z,.146),z),(.012,.008,.021),navy,seg=16,rings=10)
# Tiny skirt ribbon accents and white rear apron ties.
for s in [-1,1]:bow('Skirt bow',(s*.86,-.52,1.54),.31,navy);uv('Skirt bow gold button',(s*.86,-.554,1.54),(.024,.014,.024),gold,seg=20,rings=12)
bow('Back apron bow',(0,.365,2.23),1.10,white)
for s in [-1,1]:
 pts=[(s*.06,.40,2.18),(s*.20,.57,1.97),(s*.28,.665,1.70),(s*.21,.72,1.54)]
 lock('Long white apron sash',pts,.10,.024,white,24,10,False)

# Hands-on-hips pose: puffed shoulders, bent short sleeves, wrists and fingers.
for s in [-1,1]:
 uv('Rounded puff sleeve',(s*.565,-.015,2.755),(.275,.275,.285),navy,(0,s*.16,0))
 for j in range(5):
  a=-.9+j*.45;curve('Puff sleeve tailored fold',[(s*(.54+.15*cos(a)),-.22+.04*sin(a),2.93),(s*(.63+.16*cos(a)),-.252+.05*sin(a),2.78),(s*(.72+.13*cos(a)),-.22+.04*sin(a),2.60)],.0055,shadow)
 pts=[(s*.63,-.03,2.75),(s*.91,-.06,2.59),(s*.91,-.14,2.38),(s*.715,-.34,2.30)]
 tube('Bent maid sleeve',pts,[.22,.205,.165,.142],navy,24,40,1.0)
 wrist=Vector((s*.704,-.347,2.298));axis=Vector((-s*.19,-.12,-.012));t=axis.normalized()
 ring('Cuff gold band',wrist-t*.06,t,.153,.011,gold)
 ring('White cuff hem',wrist+t*.023,t,.154,.033,white)
 # Small scalloped cuff lobes rotate around the same wrist axis.
 u=t.cross(Vector((0,-1,0))).normalized();v=u.cross(t).normalized()
 for j in range(10):
  a=j*2*pi/10;c=wrist+t*.04+u*.143*cos(a)+v*.143*sin(a)
  uv('Cuff scallop',tuple(c),(.039,.035,.039),white,seg=16,rings=10)
 hand=Vector((s*.574,-.425,2.277))
 uv('Hip-resting palm',tuple(hand),(.13,.070,.092),skin,(0,s*.32,s*.27),32,20)
 for j in range(4):
  c=(s*(.505+j*.041),-.465-j*.002,2.250-.006*j)
  uv('Hip-resting finger',c,(.034,.037,.086),skin,(0,-s*.20,s*.25),20,14)
 uv('Hip-resting thumb',(s*.50,-.434,2.33),(.070,.045,.038),skin,(0,s*.32,-s*.35),24,16)

# Inferred full-body additions: two independently modeled anatomical legs.
# Knee, calf, ankle, stocking welt and shoe forms are deliberately distinct.
for s in [-1,1]:
 profile=[(.32,.082,.10),(.43,.090,.10),(.60,.115,.118),(.78,.148,.145),(.93,.134,.128),(1.075,.125,.125),(1.23,.155,.151),(1.43,.183,.177),(1.60,.193,.185)]
 vs=[];fs=[];N=40
 for z,rx,ry in profile:
  cx=s*(.31+.045*sin((z-.32)/1.28*pi));cy=.01+.027*sin(z*3)
  for j in range(N):a=2*pi*j/N;vs.append((cx+rx*cos(a),cy+ry*sin(a),z))
 for i in range(len(profile)-1):
  for j in range(N):a=i*N+j;b=i*N+(j+1)%N;fs.append((a,b,b+N,a+N))
 fs.extend([tuple(range(N-1,-1,-1)),tuple((len(profile)-1)*N+j for j in range(N))]);mesh('Left ivory stocking' if s<0 else 'Right ivory stocking',vs,fs,white,1)
 for z in [1.31,1.345]:curve('Stocking top welt',[(s*.347+.164*cos(2*pi*j/48),.0+.16*sin(2*pi*j/48),z) for j in range(49)],.011,cream)
 # Foot stocking visible at the Mary Jane shoe opening.
 uv('Stocking-covered foot',(s*.31,-.125,.291),(.123,.222,.133),white,seg=32,rings=20)
 # Smooth closed shoe last, with a broad toe, narrow heel and a flat sole.
 sections=[(-.465,.008,.23,.025),(-.442,.105,.225,.065),(-.37,.167,.229,.086),(-.245,.183,.232,.100),(-.10,.171,.235,.097),(.025,.141,.244,.104),(.13,.119,.244,.108),(.195,.080,.233,.095),(.215,.008,.23,.03)]
 vs=[];fs=[];N=32
 for y,w,zc,h in sections:
  for j in range(N):
   a=2*pi*j/N;z=zc+h*cos(a);vs.append((s*.31+w*sin(a),y,max(.139,z)))
 for i in range(len(sections)-1):
  for j in range(N):a=i*N+j;b=i*N+(j+1)%N;fs.append((a,b,b+N,a+N))
 fs.extend([tuple(range(N-1,-1,-1)),tuple((len(sections)-1)*N+j for j in range(N))]);mesh('Polished navy Mary Jane shoe',vs,fs,navy,1)
 # Outsole with an actual beveled footprint.
 sole_outline=[(s*.31+w*sin(2*pi*j/64),-.12-.342*cos(2*pi*j/64),.137) for j,w in [(j,.179-.038*(1-cos(2*pi*j/64))/2) for j in range(65)]]
 curve('Shoe outsole edge',sole_outline,.028,black)
 # Curved instep strap, plus a brass side clasp.
 curve('Mary Jane instep strap',[(s*.31+.136*cos(pi*j/24),-.073,.299+.064*sin(pi*j/24)) for j in range(25)],.024,navy)
 uv('Shoe strap buckle',(s*(.31+.138),-.081,.322),(.029,.027,.029),gold,seg=20,rings=12)
 uv('Short shoe heel',(s*.31,.118,.119),(.107,.101,.042),black,seg=24,rings=14)

# Continuous swept whale tail with broad, paired flukes; no disconnected rods.
tailparts=[]
pts=[(.05,.33,1.99),(.40,.51,1.25),(1.15,.57,.91),(1.65,.46,1.23),(1.79,.32,1.96),(1.87,.29,2.30)]
tailparts.append(tube('Whale tail curved peduncle',pts,[.275,.255,.205,.173,.115,.075],hair,28,90,.67))
# Thick leaf lobes join the peduncle into a single manifold fin mesh.
def fluke(n,pts,widths):
 vs=[];fs=[];N=48;S=16
 for i in range(N+1):
  t=i/N;c=bez(pts,t);tg=(bez(pts,min(1,t+.002))-bez(pts,max(0,t-.002))).normalized();u=Vector((tg.z,0,-tg.x)).normalized();v=Vector((0,1,0));p=t*(len(widths)-1);k=min(int(p),len(widths)-2);w=widths[k]*(1-(p-k))+widths[k+1]*(p-k)
  for j in range(S):a=2*pi*j/S;vs.append(tuple(c+u*w*cos(a)+v*(.04+.036*sin(pi*t))*sin(a)))
 for i in range(N):
  for j in range(S):a=i*S+j;b=i*S+(j+1)%S;fs.append((a,b,b+S,a+S))
 fs.extend([tuple(range(S-1,-1,-1)),tuple(N*S+j for j in range(S))]);return mesh(n,vs,fs,hair,1)
tailparts.append(fluke('Upper whale fluke',[(1.855,.29,2.24),(1.47,.29,2.51),(1.43,.31,2.85),(1.63,.34,3.015)],[.10,.205,.175,.008]))
tailparts.append(fluke('Outer whale fluke',[(1.86,.29,2.25),(2.14,.31,2.40),(2.49,.36,2.40),(2.67,.39,2.66)],[.11,.25,.195,.008]))
# Voxel union creates an actual continuous tail instead of overlapping primitives.
bpy.ops.object.select_all(action='DESELECT')
for o in tailparts:o.select_set(True)
bpy.context.view_layer.objects.active=tailparts[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join();tail=bpy.context.object;tail.name='Continuous whale tail with broad flukes'
for o in tailparts:
 if o!=tail and o in model:model.remove(o)
mod=tail.modifiers.new('Unified fluke and peduncle surface','REMESH');mod.mode='VOXEL';mod.voxel_size=.022;mod.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=mod.name)
mod=tail.modifiers.new('Polish whale tail','SMOOTH');mod.factor=.55;mod.iterations=4;bpy.ops.object.modifier_apply(modifier=mod.name)
# The .022-unit unified tail already has ample silhouette resolution.
# Smooth vertex normals avoid a redundant fourfold subdivision for the web mesh.
# The clean navy tail intentionally has no separate trim that could float off its surface.
# Compact studio plinth: legs and feet remain completely readable.
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=1.31,depth=.105,location=(0,0,.045));o=bpy.context.object;o.scale.y=.73;finish(o,'Oval display plinth',base);b=o.modifiers.new('Rounded plinth edge','BEVEL');b.width=.045;b.segments=4
curve('Plinth rim inlay',[(1.26*cos(2*pi*j/128),.91*sin(2*pi*j/128),.072) for j in range(129)],.009,gold)

# Apply geometry and coherent outward normals before web export.
bpy.ops.object.select_all(action='DESELECT')
model=[o for o in model if o.name in bpy.data.objects]
for o in model:o.select_set(True)
bpy.context.view_layer.objects.active=model[0];bpy.ops.object.convert(target='MESH')
for o in list(bpy.context.selected_objects):
 bpy.context.view_layer.objects.active=o
 for m in list(o.modifiers):
  try:bpy.ops.object.modifier_apply(modifier=m.name)
  except RuntimeError:pass
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
# Preserve every approved head vertex. Remove only redundant tessellation on new
# body parts; the procedural source remains editable and silhouette-led.
profile=[]
for o in bpy.context.selected_objects:
 before=len(o.data.polygons)
 if not o.get('preserveApprovedHead') and before>400:
  bpy.context.view_layer.objects.active=o;m=o.modifiers.new('Web silhouette-preserving simplification','DECIMATE');m.ratio=.80;bpy.ops.object.modifier_apply(modifier=m.name)
 profile.append({'name':o.name,'polygonsBefore':before,'polygonsAfter':len(o.data.polygons),'approvedHeadPreserved':bool(o.get('preserveApprovedHead'))})
with open(os.path.join(REVIEW,'geometry-profile.json'),'w') as f:json.dump(sorted(profile,key=lambda x:x['polygonsAfter'],reverse=True),f,indent=2)
import bmesh
for o in bpy.context.selected_objects:
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
 if o.get('facePatch'):
  if sum(f.normal.y*f.calc_area() for f in bm.faces)>0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
 elif all(e.is_manifold for e in bm.edges) and bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
 bm.to_mesh(o.data);bm.free();o.data.update()
bpy.context.view_layer.objects.active=bpy.context.selected_objects[0];bpy.ops.object.join();o=bpy.context.object;o.name='Deep Whale Maid - full-body static v0.2.0'
o['assetLicense']='CC-BY-NC-SA-4.0';o['modelStatus']='static-full-body-inferred-reconstruction';o['version']='0.2.0';o['inferredParts']='Legs, stockings, shoes, side/back volume, tail depth';o['rigged']=False
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'deep-whale-maid.glb'),export_format='GLB',export_copyright='CC BY-NC-SA 4.0; character: 上善无形; maid design: ZipZipPipe; reference adaptation: Small-tailqwq; 3D reconstruction: AI Moe Atlas (AI-assisted). Full attribution and inference notes in NOTICE.txt.',use_selection=True,export_yup=True,export_apply=True,export_texcoords=False,export_extras=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=80;scene.cycles.use_denoising=False;scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.62,.73,.83,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.38;scene.view_settings.view_transform='AgX';scene.render.resolution_x=1200;scene.render.resolution_y=1400;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True

def point(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
for n,loc,power,size in [('Large soft key',(-3,-5,7),720,4.5),('Cool fill',(5,-3,4.5),470,3.5),('Hair and tail rim',(1,4,6),900,3.0)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=n;o.data.energy=power;o.data.shape='DISK';o.data.size=size;point(o,(.3,0,2.5))
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=5.95;cam.location=(.6,-10,3.17);point(cam,(.6,0,2.60));cam.data.lens=55
# Save geometry first. Changing a live console into a 3D editor does not create
# region_3d synchronously in every Blender UI, so guard it and finish after redraw.
def prepare_viewports():
 for screen in bpy.data.screens:
  for area in screen.areas:
   if area.type=='VIEW_3D' or (area.type=='CONSOLE' and screen==bpy.context.screen):
    area.type='VIEW_3D';space=area.spaces.active
    space.overlay.show_overlays=False;space.shading.type='MATERIAL'
    if space.region_3d:
     space.region_3d.view_distance=7.5;space.region_3d.view_location=(.5,0,2.60);space.region_3d.view_rotation=cam.rotation_euler.to_quaternion()
def save_viewport_ready_source():
 prepare_viewports()
 bpy.ops.wm.save_as_mainfile(filepath=os.path.join(REVIEW,'deep-whale-maid-v0.2.0.blend'),compress=True)
 return None
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(REVIEW,'deep-whale-maid-v0.2.0.blend'),compress=True)
if bpy.app.background:
 save_viewport_ready_source()
else:
 prepare_viewports()
 bpy.app.timers.register(save_viewport_ready_source,first_interval=.4)
if '--render-views' in sys.argv:
 for n,loc,target in [('front',(.60,-10,3.17),(.60,0,2.60)),('three-quarter',(6,-10,4.27),(.50,0,2.60)),('side',(10,0,3.17),(0,0,2.60)),('back',(.60,10,3.17),(.60,0,2.60))]:
  cam.location=loc;point(cam,target);scene.render.filepath=os.path.join(REVIEW,n+'.png');bpy.ops.render.render(write_still=True)
  if n=='three-quarter':bpy.data.images['Render Result'].save_render(os.path.join(OUT,'poster.png'),scene=scene)
print('FULLBODY_MODEL_EXPORT_COMPLETE',os.path.join(OUT,'deep-whale-maid.glb'))
