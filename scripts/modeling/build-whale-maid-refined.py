"""Deep Whale Maid v0.3.0: static full-body procedural interpretation.
CC BY-NC-SA 4.0. Original character: 上善无形; maid design: ZipZipPipe;
published adaptation: Small-tailqwq; reconstruction: AI Moe Atlas (AI-assisted).
Reference-fidelity refinement of the v0.2 full-body model, with user-selected C face. Legs, stockings, shoes, side and back
are inferred additions, not canonical reference details. No rig or animation.
Run in Blender 4.3+: blender --background --python this-file -- --render-views
Review output defaults to artifacts/models/deep-whale-maid/v0.3.0; override
ATLAS_MODEL_REVIEW_DIR to keep renders/source in a separate local directory.
"""
import bpy, math, os, sys, json
from math import sin,cos,pi,sqrt
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
OUT=os.path.join(ROOT,'public/models/deep-whale-maid/v0.3.0')
REVIEW=os.environ.get('ATLAS_MODEL_REVIEW_DIR',os.path.join(ROOT,'artifacts/models/deep-whale-maid/v0.3.0'))
os.makedirs(OUT,exist_ok=True);os.makedirs(REVIEW,exist_ok=True)
# Reset this generated scene explicitly, including hidden editable parts from a
# previous GUI run. Context-based Select All/Delete skips hidden collections.
for old_object in list(bpy.data.objects):bpy.data.objects.remove(old_object,do_unlink=True)
for old_collection in list(bpy.data.collections):bpy.data.collections.remove(old_collection)
for datablocks in [bpy.data.meshes,bpy.data.curves,bpy.data.cameras,bpy.data.lights]:
 for datablock in list(datablocks):
  if datablock.users==0:datablocks.remove(datablock)
for m in list(bpy.data.materials):bpy.data.materials.remove(m)
def mat(n,c,r=.65,metal=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=r;p.inputs['Metallic'].default_value=metal;return m
skin=mat('Porcelain skin',(.98,.69,.59));white=mat('Ivory cotton',(.95,.92,.89));navy=mat('Midnight uniform',(.012,.020,.058));hair=mat('Indigo hair',(.016,.030,.091));tips=mat('Blue tips',(.15,.35,.61));shadow=mat('Indigo shadow',(.021,.039,.103));blue=mat('Ocean ribbon',(.07,.30,.56));gold=mat('Gold piping',(.57,.34,.095),.38,.55);black=mat('Ink lashes',(.011,.015,.038));mouth=mat('Mouth',(.29,.045,.064));tongue=mat('Tongue',(.96,.24,.29));blush=mat('Rosy cheeks',(.98,.51,.46));iris=mat('Sapphire iris',(.039,.16,.37));aqua=mat('Aqua iris',(.12,.57,.81));pupil=mat('Deep pupils',(.018,.042,.096));shine=mat('Catchlights',(1,1,1),.2);base=mat('Plinth',(.14,.27,.38));cream=mat('Apron shadows',(.76,.82,.89))
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
 d=bpy.data.curves.new(n,'CURVE');d.dimensions='3D';d.resolution_u=(2 if len(pts)>12 else 6) if BODY_STAGE else (3 if len(pts)>12 else 10);d.bevel_depth=r;d.bevel_resolution=2;s=d.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
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
    a=j*2*pi/B;zz=z+width*cos(a);yy=y+.026*u*size+.026*sin(a)*size*sin(pi*u)**.6
    vs.append((xx,yy,zz))
  for i in range(A):
   for j in range(B):a=i*B+j;b=i*B+(j+1)%B;fs.append((a,b,b+B,a+B))
  fs.extend([tuple(range(B-1,-1,-1)),tuple(A*B+j for j in range(B))]);mesh(n+' sculpted ribbon loop',vs,fs,m,1)
  # Tapered ribbon ends are distinct cloth pieces.
  pts=[(x+sign*.05*size,y+.02*size,z-.025*size),(x+sign*.13*size,y+.015*size,z-.12*size),(x+sign*.16*size,y+.045*size,z-.27*size)]
  lock(n+' ribbon tail',pts,.058*size,.008*size,m,16,8,False)
 uv(n+' knot',(x,y-.035*size,z),(.044*size,.029*size,.055*size),m)
 if m==navy:
  for sign in [-1,1]:
   curve(n+' fine ribbon seam',[(x+sign*.055*size,y-.017*size,z+.018*size),(x+sign*.24*size,y-.005*size,z+.107*size),(x+sign*.322*size,y+.010*size,z+.07*size)],.0035*size,gold)

# Garment construction helpers. Every fold below is actual surface geometry.
def shell(n,profile,m,folds=0,amount=0,sides=96):
 vs=[];fs=[]
 for k,(z,rx,ry) in enumerate(profile):
  for j in range(sides):
   a=2*pi*j/sides;f=amount*sin(folds*a) if folds else 0
   vs.append(((rx+f)*sin(a),-(ry+f*.65)*cos(a),z+.014*sin(folds*a) if folds else z))
 for k in range(len(profile)-1):
  for j in range(sides):a=k*sides+j;b=k*sides+(j+1)%sides;fs.append((a,b,b+sides,a+sides))
 o=mesh(n,vs,fs,m,1);o.modifiers.new('Tailored fabric thickness','SOLIDIFY').thickness=.017;return o

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

# Reference-matched head refinement: shallow painted eye surfaces, swept ribbon
# clumps and fine cloth. The confident closed omega expression is retained.
head_start=len(model)
# Stage 2. Broad, gently rounded chibi face; the scalp hides the upper pole.
vs=[];fs=[];N=72;M=48
FACE_Z=2.13;FACE_H=.735;FACE_W=.805;FACE_D=.505
for i in range(M+1):
 t=pi*i/M;z=FACE_Z+FACE_H*cos(t);chin=1-.055*max(0,-cos(t))
 for j in range(N):a=j*2*pi/N;vs.append((FACE_W*sin(t)*sin(a)*chin,-FACE_D*sin(t)*cos(a),z))
for i in range(M):
 for j in range(N):a=i*N+j;b=i*N+(j+1)%N;fs.append((a,b,b+N,a+N))
face=mesh('Refined rounded face',vs,fs,skin,1)
# Blush is pigment on the actual face, so there are no floating cheek-patch edges.
face_color=mat('Painted porcelain skin',(1,1,1),.65)
nt=face_color.node_tree;vnode=nt.nodes.new('ShaderNodeVertexColor');vnode.layer_name='Color';nt.links.new(vnode.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color'])
face.data.materials.clear();face.data.materials.append(face_color)
col=face.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
for i,v in enumerate(face.data.vertices):
 x,y,z=v.co;strength=0
 if y<-.25:
  for sign in [-1,1]:strength+=.46*math.exp(-(((x-sign*.47)/.145)**2+((z-1.807)/.081)**2)*1.65)
 strength=min(.43,strength);col.data[i].color=(*(a*(1-strength)+b*strength for a,b in zip((.98,.69,.59),(.98,.38,.41))),1)
def fy(x,z,o=0):return -FACE_D*sqrt(max(.07,1-(x/FACE_W)**2-((z-FACE_Z)/FACE_H)**2))-o

def vertex_material(n,roughness=.65):
 m=mat(n,(1,1,1),roughness);nt=m.node_tree;v=nt.nodes.new('ShaderNodeVertexColor');v.layer_name='Color';nt.links.new(v.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color']);return m
painted_eye=vertex_material('Painted sapphire eyes',.78)
painted_skin=vertex_material('Soft cheek pigment',.78)
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def mix(a,b,t):return tuple(a[k]*(1-t)+b[k]*t for k in range(3))
def colored_mesh(n,vs,fs,cols,m):
 o=mesh(n,vs,fs,m);attr=o.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
 for i,c in enumerate(cols):attr.data[i].color=(*c,1)
 o['facePatch']=True;return o

def eye_bounds(u):
 # Narrow inner corner, lifted outer point, arched top, quiet almost-flat lower lid.
 h=max(0,1-u*u)**.52
 return (-.177*h+.004*u,.202*h+.006*u)
def eye_color(dx,dz):
 c=(.96,.97,1.0);ix=(dx-.004)/.160;iz=(dz-.004)/.190;rad=sqrt(ix*ix+iz*iz)
 if rad<1.025:
  # Entire iris is painted on the same surface, without stacked discs or relief.
  v=max(0,min(1,(dz+.19)/.38));ir=mix((.10,.51,.88),(.013,.035,.105),smooth(.05,.90,v))
  ir=mix(ir,(.008,.020,.075),smooth(.82,1.00,rad)*.75)
  ir=mix(ir,(.008,.015,.046),(1-smooth(.84,1.1,sqrt((dx/.051)**2+((dz-.023)/.105)**2)))*.90)
  # Low-key painted lower iris shards reproduce the source's blue/cyan facets.
  facet=max(0,1-abs(dx/.125+.34))*(1-smooth(-.09,.002,dz))*smooth(-.135,-.10,dz)
  ir=mix(ir,(.16,.51,.91),facet*.6)
  for hx,hz,rx,rz,amount in [(-.052,.097,.032,.039,1),(.061,-.093,.019,.020,.96),(-.056,-.050,.010,.024,.43)]:
   d=sqrt(((dx-hx)/rx)**2+((dz-hz)/rz)**2);ir=mix(ir,(1,1,1),(1-smooth(.80,1.05,d))*amount)
  c=mix(c,ir,1-smooth(.98,1.025,rad))
 # Painted shadow under the upper lash makes an integrated anime eye.
 return c
for sign in [-1,1]:
 cx=sign*.305;cz=2.065;vs=[];fs=[];cols=[];A=72;B=40
 for i in range(A+1):
  u=-1+2*i/A;lo,hi=eye_bounds(u)
  for j in range(B+1):
   q=j/B;dx=.221*u;dz=lo*(1-q)+hi*q;x=cx+sign*dx;z=cz+dz
   vs.append((x,fy(x,z,.006),z));cols.append(eye_color(dx,dz))
 for i in range(A):
  for j in range(B):a=i*(B+1)+j;fs.append((a,a+1,a+B+2,a+B+1))
 colored_mesh('Left painted anime eye' if sign<0 else 'Right painted anime eye',vs,fs,cols,painted_eye)
 # Tapered flat upper eyelash; no thick cylindrical rim around the iris.
 vs=[];fs=[];A=56
 for i in range(A+1):
  u=-1+2*i/A;lo,hi=eye_bounds(u);x=cx+sign*.221*u;z=cz+hi
  width=.003+.022*(sin(pi*i/A)**.7)+.015*smooth(.25,1,u)
  for zz in [z-.002,z+width]:vs.append((x,fy(x,zz,.010),zz))
 for i in range(A):a=i*2;fs.append((a,a+1,a+3,a+2))
 o=mesh('Tapered upper anime lash',vs,fs,black);o['facePatch']=True
 for j in range(2):
  x=cx+sign*(.198-j*.027);z=cz+.072+j*.045
  pts=[(x,fy(x,z,.012),z),(x+sign*.048,fy(x+sign*.048,z+.01,.012),z+.011),(x+sign*(.077-j*.008),fy(x+sign*(.077-j*.008),z+.044,.012),z+.044)]
  lock('Fine outer eyelash',pts,.015-j*.003,.004,black,12,8)
 pts=[]
 for j in range(28):
  u=-.8+1.72*j/27;lo,hi=eye_bounds(u);x=cx+sign*.221*u;z=cz+lo;pts.append((x,fy(x,z,.008),z))
 curve('Quiet lower lash',pts,.003,shadow)
 curve('Soft brow',[(cx-sign*.113,fy(cx-sign*.113,2.371,.008),2.371),(cx,fy(cx,2.389,.008),2.389),(cx+sign*.122,fy(cx+sign*.122,2.372,.008),2.372)],.010,hair)
uv('Subtle button nose',(0,fy(0,1.913,.006),1.913),(.014,.008,.013),skin,seg=20,rings=14)
smile=[(-.071,1.764),(-.046,1.742),(-.021,1.745),(0,1.759),(.021,1.745),(.046,1.742),(.071,1.764)]
curve('Closed omega smile',[(x,fy(x,z,.007),z) for x,z in smile],.0075,mouth)


# Stage 3. Broad flattened hair clumps with swept roots and wispy gradient ends.
# A custom cross-section avoids the parallel cylindrical look of the earlier mesh.
def hair_sheet(n,pts,w,d=.048,rings=36,sides=12,gradient=True,root=.30,twist=0):
 vs=[];fs=[];cols=[]
 for i in range(rings+1):
  t=i/rings;c=bez(pts,t);tg=(bez(pts,min(1,t+.002))-bez(pts,max(0,t-.002))).normalized();u=tg.cross(Vector((0,-1,0))).normalized();v=u.cross(tg).normalized();u,v=u*cos(twist)+v*sin(twist),v*cos(twist)-u*sin(twist)
  r=(root+(1-root)*sin(pi*min(1,t*1.10)))*((1-t)**.45)
  if i==rings:r=.002
  for j in range(sides):
   a=2*pi*j/sides;xx=cos(a);yy=sin(a);vs.append(tuple(c+u*xx*w*r+v*yy*d*r*(.82+.18*cos(a*2))))
   f=smooth(.42,.99,t) if gradient else 0
   basecol=mix((.014,.026,.086),(.07,.33,.57),f)
   # Gentle broad painted strand highlight, with a narrow dark separation edge.
   light=(max(0,1-abs(xx+.23)/.73)**2)*(.18+.13*sin(pi*t))
   col=mix(basecol,mix((.065,.105,.24),(.18,.49,.70),f),light)
   cols.append(col)
 for i in range(rings):
  for j in range(sides):a=i*sides+j;b=i*sides+(j+1)%sides;fs.append((a,b,b+sides,a+sides))
 fs.extend([tuple(range(sides-1,-1,-1)),tuple(rings*sides+j for j in range(sides))]);o=mesh(n,vs,fs,hairgrad,1)
 col=o.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
 for i,c in enumerate(cols):col.data[i].color=(*c,1)
 return o
vs=[];fs=[]
for i in range(29):
 for j in range(80):
  a=2*pi*j/80;t=i/28*(2.03-.87*(1+cos(a))/2);vs.append((.846*sin(t)*sin(a),-.562*sin(t)*cos(a)+.043,2.18+.82*cos(t)))
for i in range(28):
 for j in range(80):a=i*80+j;b=i*80+(j+1)%80;fs.append((a,b,b+80,a+80))
mesh('Smooth indigo scalp',vs,fs,hair,1)
# A continuous rear curtain gives the layered clumps coherent side/back volume.
# It is an intentionally inferred hidden volume, not a claimed reference detail.
vs=[];fs=[];cols=[];A=56;B=16
profile=[(2.76,.585,.39),(2.45,.755,.535),(2.05,.80,.55),(1.63,.835,.545),(1.18,.865,.535),(.67,.79,.49)]
for i in range(B+1):
 t=i/B;u=t*(len(profile)-1);k=min(int(u),len(profile)-2);f=u-k
 z,rx,ry=[profile[k][j]*(1-f)+profile[k+1][j]*f for j in range(3)]
 for j in range(A+1):
  a=.36*pi+1.28*pi*j/A;wave=.015*sin(a*9+t*5);x=(rx+wave)*sin(a);y=-(ry+wave)*cos(a)+.04;zz=z+.06*cos(a*10)*t**5
  y+=.25*max(0,min(1,(2.30-zz)/1.65));zz-=.19*max(0,min(1,(2.30-zz)/1.65))
  vs.append((x,y,zz));cols.append(mix((.014,.026,.086),(.06,.255,.45),smooth(.54,1,t)))
for i in range(B):
 for j in range(A):a=i*(A+1)+j;fs.append((a,a+1,a+A+2,a+A+1))
o=mesh('Continuous layered hair undercoat',vs,fs,hairgrad,1);o.modifiers.new('Hair curtain volume','SOLIDIFY').thickness=.028
attr=o.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
for i,c in enumerate(cols):attr.data[i].color=(*c,1)

# Unequal broad, layered back locks: overlapping roots continue the crown smoothly.
for j in range(7):
 x=-.66+j*.22;wave=.11*sin(j*1.67);y=.43+.15*(1-(x/.80)**2)
 pts=[(x*.59,y*.48,2.91),(x*.91,y,2.37),(x*1.04+wave,y+.028,1.66),(x*1.15-wave*.65,y+.025,1.05),(x*1.19+wave*1.3,y-.03,.47+.09*((j+1)%3))]
 hair_sheet('Layered back sweep %02d'%j,pts,.243+.024*(j%2),.054,44,12,True,.08,-x*.43)
 # Fine split tips follow the main clump rather than adding parallel full-length rods.
 if j%2==0:
  hair_sheet('Back wispy split %02d'%j,[(x*.97,y-.025,1.36),(x*1.23+wave,y-.025,.96),(x*1.10+wave*.5,y-.12,.62),(x*1.30+wave*.6,y-.10,.50)],.070,.023,24)
for sign in [-1,1]:
 # Three side curtains with alternating wide S-curves, rather than repeated columns.
 side_paths=[
  [(sign*.60,.07,2.73),(sign*.80,.14,2.15),(sign*.77,.13,1.40),(sign*1.10,.02,.87),(sign*.87,-.11,.47)],
  [(sign*.65,.19,2.69),(sign*.94,.24,2.00),(sign*1.03,.22,1.45),(sign*.85,.09,.83),(sign*1.12,-.02,.57)],
  [(sign*.70,.32,2.52),(sign*.98,.35,1.91),(sign*.87,.30,1.29),(sign*1.18,.21,.89),(sign*1.08,.09,.65)]]
 for j,pts in enumerate(side_paths):hair_sheet('Swept side curtain',pts,.232-j*.022,.053,44,12,True,.16,-sign*.50)
 # A shorter wavy blue lock at each cheek is a prominent source-image detail.
 hair_sheet('Blue cheek curl',[(sign*.69,-.25,1.93),(sign*.56,-.28,1.63),(sign*.61,-.24,1.38),(sign*.79,-.17,1.23),(sign*.71,-.21,1.02)],.130,.039,36,12,True,.30,-sign*.35)
 hair_sheet('Face wispy tip',[(sign*.62,-.25,1.55),(sign*.60,-.32,1.29),(sign*.77,-.24,1.16),(sign*.81,-.19,1.07)],.046,.018,24)
 # Thin tapered whale-fin ears; pale underside is a fine shaped inset.
 outline=[(sign*.71,-.015,2.36),(sign*.94,-.04,2.24),(sign*1.11,-.024,2.185),(sign*1.33,-.035,2.20),(sign*1.18,-.075,2.095),(sign*.97,-.10,2.060),(sign*.80,-.10,2.145)]
 o=mesh('Thin whale fin ear',outline,[tuple(range(7))],hair,2);o.modifiers.new('Thin fin depth','SOLIDIFY').thickness=.030
 pale=[(sign*.805,-.112,2.170),(sign*.995,-.116,2.122),(sign*1.17,-.090,2.143),(sign*1.255,-.065,2.169),(sign*1.14,-.088,2.089),(sign*.99,-.116,2.075),(sign*.86,-.118,2.126)]
 o=mesh('Feather-light fin underside',pale,[tuple(range(7))],cream,2);o.modifiers.new('Fin inset depth','SOLIDIFY').thickness=.008
# Split, swept fringe. The small pointed center part stays well above the eye field.
hair_sheet('Center swept fringe',[(.015,-.385,2.985),(-.11,-.555,2.76),(-.075,-.570,2.43),(.065,-.546,2.292)],.196,.035,40,12,False)
for sign in [-1,1]:
 hair_sheet('Parted swept bang',[(sign*.16,-.366,2.981),(sign*.42,-.516,2.78),(sign*.43,-.564,2.48),(sign*.31,-.542,2.365)],.201,.036,40,12,False)
 hair_sheet('Outer cheek framing sweep',[(sign*.385,-.238,2.85),(sign*.70,-.411,2.59),(sign*.77,-.40,2.18),(sign*.65,-.431,1.951),(sign*.49,-.447,1.94)],.206,.044,42,12,False)
 hair_sheet('Fine outer cheek point',[(sign*.74,-.367,2.26),(sign*.75,-.42,2.045),(sign*.67,-.448,1.902),(sign*.54,-.444,1.89)],.070,.021,28,10,False)
# Thin looped ahoge matches the reference's airy upper-left silhouette.
hair_sheet('Looped fine ahoge',[(.03,-.035,2.99),(.08,-.03,3.46),(-.28,-.08,3.48),(-.59,-.13,3.32),(-.67,-.17,3.13),(-.58,-.18,3.075)],.033,.014,64,10,False,1.0)

# Stage 4. Narrow headband plus continuous, softly gathered cloth lace.
curve('Fine white headband',[(.878*cos(j*pi/64),-.080,2.22+.856*sin(j*pi/64)) for j in range(65)],.023,white)
vs=[];fs=[];A=120;B=4
for i in range(A+1):
 a=.075*pi+i/A*.85*pi;c=Vector((.882*cos(a),-.016,2.22+.865*sin(a)));rad=Vector((cos(a),0,sin(a)))
 for j in range(B+1):
  q=j/B;r=.014+q*(.112+.015*cos(i/A*18*pi));p=c+rad*r;p.y+=.010+.024*sin(i/A*36*pi)*q;p.z+=.005*sin(i/A*36*pi)*q;vs.append(tuple(p))
for i in range(A):
 for j in range(B):a=i*(B+1)+j;fs.append((a,a+1,a+B+2,a+B+1))
o=mesh('Continuous fine maid lace',vs,fs,white,1);o.modifiers.new('Fine lace thickness','SOLIDIFY').thickness=.007
bow('Side ribbon',(.917,-.267,2.43),.71,blue)

for o in model[head_start:]:
 o.location.z+=1.60
 o['refinedHead']=True
 if o.type=='MESH' and any(o.name.startswith(n) for n in ['Layered back sweep','Back wispy split','Swept side curtain','Blue cheek curl','Face wispy tip']):
  for v in o.data.vertices:
   v.co.y+=.25*max(0,min(1,(2.30-v.co.z)/1.65))
   v.co.z-=.19*max(0,min(1,(2.30-v.co.z)/1.65))

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
  q=k/4;w=.055+.009*cos(i*2*pi/6);p=c+out*q*w;p.y-=.012+.018*sin(i*2*pi/6)*q;p.z+=.008*cos(i*2*pi/6)*q;vs.append(tuple(p))
for i in range(N-1):
 for k in range(4):a=i*5+k;fs.append((a,a+1,a+6,a+5))
o=mesh('Continuous fluted apron frill',vs,fs,white,1);o.modifiers.new('Apron frill thickness','SOLIDIFY').thickness=.007
curve('Apron seam',[(p.x,p.y-.018,p.z) for p in outline],.0035,cream)
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
 pts=[(s*.06,.40,2.18),(s*.26,.57,2.04),(s*.35,.72,1.89),(s*.36,.775,1.76)]
 lock('Long white apron sash',pts,.10,.024,white,24,10,False)

# Hands-on-hips pose: puffed shoulders, bent short sleeves, wrists and fingers.
for s in [-1,1]:
 uv('Rounded puff sleeve',(s*.565,-.015,2.755),(.275,.275,.285),navy,(0,s*.16,0))
 for j in range(5):
  a=-.9+j*.45;curve('Puff sleeve tailored fold',[(s*(.54+.15*cos(a)),-.22+.04*sin(a),2.93),(s*(.63+.16*cos(a)),-.252+.05*sin(a),2.78),(s*(.72+.13*cos(a)),-.22+.04*sin(a),2.60)],.0055,shadow)
 pts=[(s*.63,-.03,2.75),(s*.91,-.06,2.59),(s*.91,-.14,2.38),(s*.715,-.34,2.30)]
 tube('Bent maid sleeve',pts,[.22,.205,.165,.153],navy,24,40,1.0)
 wrist=Vector((s*.704,-.347,2.298));axis=Vector((-s*.19,-.12,-.012));t=axis.normalized()
 ring('Cuff gold band',wrist-t*.052,t,.137,.009,gold)
 ring('White cuff hem',wrist-t*.008,t,.132,.013,white)
 # Continuous thin fluted cuff, replacing the old row of bead-like scallops.
 u=t.cross(Vector((0,-1,0))).normalized();v=u.cross(t).normalized();vs=[];fs=[];N=80
 for k in range(5):
  q=k/4
  for j in range(N):
   a=j*2*pi/N;r=.127+.012*q+.006*cos(a*10)*q;c=wrist+t*(-.019+.060*q+.006*cos(a*10)*q)+u*r*cos(a)+v*r*sin(a);vs.append(tuple(c))
 for k in range(4):
  for j in range(N):a=k*N+j;b=k*N+(j+1)%N;fs.append((a,b,b+N,a+N))
 o=mesh('Fine gathered white cuff',vs,fs,white,1);o.modifiers.new('Cuff cotton thickness','SOLIDIFY').thickness=.006
 hand=Vector((s*.574,-.425,2.277))
 tube('Wrist beneath close-fitting cuff',[tuple(wrist-t*.05),tuple(wrist),tuple(hand+t*.02)],[.111,.106,.088],skin,20,18,.85)
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

# User-requested plumper, rounder whale tail with fuller paired flukes.
# Its generous curve remains one continuous mesh, with a thicker side profile.
tailparts=[]
pts=[(.05,.33,1.99),(.40,.51,1.25),(1.15,.57,.91),(1.65,.46,1.23),(1.79,.32,1.96),(1.87,.29,2.30)]
tailparts.append(tube('Whale tail curved peduncle',pts,[.325,.335,.305,.255,.174,.104],hair,28,90,.82))
# Thick leaf lobes join the peduncle into a single manifold fin mesh.
def fluke(n,pts,widths):
 vs=[];fs=[];N=48;S=16
 for i in range(N+1):
  t=i/N;c=bez(pts,t);tg=(bez(pts,min(1,t+.002))-bez(pts,max(0,t-.002))).normalized();u=Vector((tg.z,0,-tg.x)).normalized();v=Vector((0,1,0));p=t*(len(widths)-1);k=min(int(p),len(widths)-2);w=widths[k]*(1-(p-k))+widths[k+1]*(p-k)
  for j in range(S):a=2*pi*j/S;vs.append(tuple(c+u*w*cos(a)+v*(.055+.054*sin(pi*t))*sin(a)))
 for i in range(N):
  for j in range(S):a=i*S+j;b=i*S+(j+1)%S;fs.append((a,b,b+S,a+S))
 fs.extend([tuple(range(S-1,-1,-1)),tuple(N*S+j for j in range(S))]);return mesh(n,vs,fs,hair,1)
tailparts.append(fluke('Upper whale fluke',[(1.855,.29,2.24),(1.47,.29,2.51),(1.43,.31,2.85),(1.63,.34,3.015)],[.133,.268,.229,.022]))
tailparts.append(fluke('Outer whale fluke',[(1.86,.29,2.25),(2.14,.31,2.40),(2.49,.36,2.40),(2.67,.39,2.66)],[.146,.313,.248,.026]))
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
# Tuck the hidden curtain and back-lock roots into the scalp to avoid a visible
# horizontal crown seam. Apply after subdivision so the correction is exact.
for part in bpy.context.selected_objects:
 if part.name.startswith('Continuous layered hair undercoat'):
  for v in part.data.vertices:
   w=smooth(2.20,2.80,v.co.z);v.co.x*=1-.16*w;v.co.y=.04+(v.co.y-.04)*(1-.26*w)
  part['crownRootTucked']=True;part.data.update()
 elif part.name.startswith('Layered back sweep'):
  for v in part.data.vertices:
   w=smooth(2.35,2.88,v.co.z);v.co.x*=1-.02*w;v.co.y-=.055*w
  part['crownRootTucked']=True;part.data.update()
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
# Keep the painted facial patches and sculpted head intact. Simplify only body
# tessellation that does not change the silhouette.
profile=[]
for o in bpy.context.selected_objects:
 before=len(o.data.polygons)
 if not o.get('refinedHead') and before>400:
  bpy.context.view_layer.objects.active=o;m=o.modifiers.new('Web silhouette-preserving simplification','DECIMATE');m.ratio=.80;bpy.ops.object.modifier_apply(modifier=m.name)
 profile.append({'name':o.name,'polygonsBefore':before,'polygonsAfter':len(o.data.polygons),'refinedHeadPreserved':bool(o.get('refinedHead'))})
with open(os.path.join(REVIEW,'geometry-profile.json'),'w') as f:json.dump(sorted(profile,key=lambda x:x['polygonsAfter'],reverse=True),f,indent=2)
import bmesh
for o in bpy.context.selected_objects:
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
 if o.get('facePatch'):
  if sum(f.normal.y*f.calc_area() for f in bm.faces)>0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
 elif all(e.is_manifold for e in bm.edges) and bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
 bm.to_mesh(o.data);bm.free();o.data.update()
# Retain separate, named geometry in the compressed editable Blender source.
source_parts=list(bpy.context.selected_objects)
source_collection=bpy.data.collections.new('EDITABLE - refined character parts');bpy.context.scene.collection.children.link(source_collection)
for part in source_parts:
 for c in list(part.users_collection):c.objects.unlink(part)
 source_collection.objects.link(part)
bpy.ops.object.duplicate();bpy.context.view_layer.objects.active=bpy.context.selected_objects[0];bpy.ops.object.join();o=bpy.context.object;o.name='Deep Whale Maid - full-body static v0.3.0'
export_collection=bpy.data.collections.new('WEB EXPORT - joined material groups');bpy.context.scene.collection.children.link(export_collection)
for c in list(o.users_collection):c.objects.unlink(o)
export_collection.objects.link(o)
source_collection.hide_render=True
source_collection.hide_viewport=True
o['assetLicense']='CC-BY-NC-SA-4.0';o['modelStatus']='static-full-body-reference-refined-inferred-reconstruction';o['version']='0.3.0';o['inferredParts']='Legs, stockings, shoes, side/back volume, tail depth';o['rigged']=False;o['faceVariant']='C-round-eyed'
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'deep-whale-maid.glb'),export_format='GLB',export_copyright='CC BY-NC-SA 4.0; character: 上善无形; maid design: ZipZipPipe; reference adaptation: Small-tailqwq; 3D reconstruction: AI Moe Atlas (AI-assisted). Full attribution and inference notes in NOTICE.txt.',use_selection=True,export_yup=True,export_apply=True,export_texcoords=False,export_extras=True)
# The GLB is already exported. Keep only named editable parts in the .blend,
# avoiding a redundant duplicate of every vertex and material group.
export_data=o.data;bpy.data.objects.remove(o,do_unlink=True)
if export_data.users==0:bpy.data.meshes.remove(export_data)
bpy.data.collections.remove(export_collection)
source_collection.hide_render=False;source_collection.hide_viewport=False
for part in source_parts:part.hide_set(False);part.select_set(False)
bpy.context.view_layer.objects.active=next(part for part in source_parts if part.name=='Refined rounded face')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=256;scene.cycles.use_denoising=False;scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.62,.73,.83,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.38;scene.view_settings.view_transform='AgX';scene.render.resolution_x=1200;scene.render.resolution_y=1400;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True

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
 bpy.ops.wm.save_as_mainfile(filepath=os.path.join(REVIEW,'deep-whale-maid-v0.3.0.blend'),compress=True)
 return None
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(REVIEW,'deep-whale-maid-v0.3.0.blend'),compress=True)
if bpy.app.background:
 save_viewport_ready_source()
else:
 prepare_viewports()
 bpy.app.timers.register(save_viewport_ready_source,first_interval=.4)
if '--render-views' in sys.argv:
 for n,loc,target in [('front',(.60,-10,3.17),(.60,0,2.60)),('three-quarter',(6,-10,4.27),(.50,0,2.60)),('side',(10,0,3.17),(0,0,2.60)),('back',(.60,10,3.17),(.60,0,2.60))]:
  cam.location=loc;point(cam,target);scene.render.filepath=os.path.join(REVIEW,n+'.png');bpy.ops.render.render(write_still=True)
  if n=='three-quarter':bpy.data.images['Render Result'].save_render(os.path.join(OUT,'poster.png'),scene=scene)
print('REFINED_MODEL_EXPORT_COMPLETE',os.path.join(OUT,'deep-whale-maid.glb'))
