

/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(juego, x, y, gravedad, impulso, salud_actual) {

    this.que_pie_                = 0;
    this.angulo_                 = 0;
    this.size_player_pixel_      = 4;
    this.x                      = x;
    this.y                      = y;
    this.alto_                  = this.size_player_pixel_ * 12;
    this.ancho_                 = this.size_player_pixel_ * 6 + 5;
    this.centro_x_               = this.x + this.ancho_/2;
    this.centro_y_               = this.y + this.alto_/2;

    this.dx                     = 0;
    this.dy                     = 0;

    this.friction_              = 850;
    this.accel_                 = 850;
    this.shoot_back_            = 2500;

    this.maxdx_                 = 220;
    this.maxdy_                 = 550;

    this.last_left_             = false;
    

    this.gravity_               = 1000;

    this.tiempo_saltando_       = juego.timestamp_();
    this.tiempo_atacado_        = juego.timestamp_();

    this.impulse_               = 40000;   

    this.limite_derecha_        = juego.ancho_total_ + this.ancho_;
    this.limite_izquierda_      = - this.ancho_;

    this.no_dispares_counter_   = 0;

    this.salud_inicial_         = salud_actual;
    this.salud_                 = salud_actual;
    //this.salud_                 = 10000000;
    

    this.tiempo_portal_ = juego.timestamp_();
    this.tiempo_medical_ = juego.timestamp_();


 

    this.update_ = function(dt) {


        
        if(this.salud_ < 0 && !this.pre_game_over_){
            this.salud_ = 0;
            this.jump = true;
            juego.game_over_(false)
        }

        if(juego.wait_start_ > juego.timestamp_()){
            juego.portal_.x = 30;
            juego.portal_.y = juego.alto_total_ - 100;
            juego.empieza_de_verdad_ = false;
            return;
        }
        else if(!juego.empieza_de_verdad_){
            juego.situa_portal_(juego.portal_);
            while(juego.portal_mal_situado_(juego.portal_)){
                juego.situa_portal_(juego.portal_);
            }
            juego.empieza_de_verdad_ = true;
        }
      
        
        if(this.tiempo_portal_ > juego.timestamp_()){
            return; 
        }
        
        if(this.tiempo_medical_ > juego.timestamp_()){
            this.salud_ = this.salud_ + 1; 
            if(this.salud_ >= juego.salud_inicial_){
                this.salud_ = this.salud_inicial_;
            }
        }
        
        if(!juego.moustro_final_){
            if(this.entra_portal_()){
                juego.cambia_pantalla_ = true;
                this.tiempo_portal_ = juego.timestamp_() + 3000;
                this.suena_portal_();
            }
        }

        if(this.entra_medical_() && this.tiempo_medical_ < juego.timestamp_()){
            this.tiempo_medical_ = juego.timestamp_() + 2000;
            this.suena_kit_();
        }


        this.centro_x_ = this.x + this.ancho_/2;
        this.centro_y_ = this.y + this.alto_/2;

        this.wasleft_    = this.dx  < 0;
        this.wasright_   = this.dx  > 0;

        var friction_   = this.friction_ * (this.falling ? 0.2 : 1);
        var accel_      = this.accel_;

        //reseteo las velocidades
        this.ddx = 0;
        this.ddy = this.gravity_;


        if (this.left){
          this.ddx = this.ddx - accel_;
          this.last_left_ = true;
        }
        else if (this.wasleft_){
          this.ddx = this.ddx + friction_;
        }
      
        if (this.right){
          this.ddx = this.ddx + accel_;
          this.last_left_ = false;
        }
        else if (this.wasright_){
          this.ddx = this.ddx - friction_;
        }

        //Salto
        if (this.jump && !this.jumping && this.tiempo_saltando_ < juego.timestamp_() && (!juego.is_game_over_ || juego.you_win_)){
            this.ddy = this.ddy - this.impulse_; 
            this.jumping = true;
            this.falling = true;
            this.tiempo_saltando_ = juego.timestamp_() + 300;
        }


        //Si se pulsa acción
        if(this.accion && juego.counter > this.no_dispares_counter_ && !juego.is_game_over_){
            this.suena_dispara_();
            this.no_dispares_counter_ = juego.counter + 3;
            juego.tiempo_shacke_ = juego.timestamp_() + 20;
            var derecha = true;

            var retroceso_disparo = this.shoot_back_;
            if(this.jumping){
                retroceso_disparo = retroceso_disparo/2;
            }
            if(this.last_left_){
                derecha = false;
                this.ddx = this.ddx + retroceso_disparo;
            }
            else{
                this.ddx = this.ddx - retroceso_disparo;

            }
            var seft = this;
            setTimeout(function () { 
                juego.bullets_.push(
                    new Bullet(seft.x, seft.y - 10, -10, -3, derecha, juego, seft)
                );
            },dt/3);
            
            setTimeout(function () {
                juego.bullets_.push(
                    new Bullet(seft.x, seft.y + 10, 10, 3, derecha, juego, seft)
                );
            },2*dt/3);

            juego.bullets_.push(
                new Bullet(this.x, this.y, 0, 0, derecha, juego, this)
            );
        }

        var retroceso_herido_x = this.shoot_back_ * 10;
        var retroceso_herido_y = this.shoot_back_;
        if((this.tiempo_atacado_ - juego.timestamp_())>1900){
            
            this.ddx = this.ddx + retroceso_herido_x * (0.5 - Math.random());
            this.ddy = this.ddy + retroceso_herido_y * (0.5 - Math.random());
            
        }
        if(juego.is_game_over_){
            this.dx  = 2000 * dt;
            this.last_left_ = false;
            if(juego.you_win_){
                this.jump = true;
                this.dx  = 7000 * dt;
            }
        }
        this.x  = this.x  + (dt * this.dx);
        this.y  = this.y  + (dt * this.dy);

        
        this.dx = juego.bound_(this.dx + (dt * this.ddx), -this.maxdx_, this.maxdx_);
        this.dy = juego.bound_(this.dy + (dt * this.ddy), -this.maxdy_, this.maxdy_);

        
      
        if ((this.wasleft_  && (this.dx > 0)) ||
            (this.wasright_ && (this.dx < 0))) {
          this.dx = 0; // clamp at zero to prevent friction_ from making us jiggle side to side
        }
        

        var abajo_exacto        = (this.y + this.alto_) % juego.MAP_.ancho_bloques_;
        var arriba_exacto       = this.y % juego.MAP_.ancho_bloques_;


        var tiene_up = false;
        for (var i = this.x + 5; i <= this.x + this.ancho_ - 5; i++) {
            if(juego.cell_(i, this.y - 2)){
                tiene_up = true;
            }
        }
        var tiene_down = false;
        for (var j = this.x + 5; j <= this.x + this.ancho_ - 5; j++) {
            if(juego.cell_(j, this.y + this.alto_)){
                tiene_down = true;
            }
        }
        var tiene_left = false;
        for (var k = this.y + 5 ; k <= this.y + this.alto_ - 5; k++) {
            if(juego.cell_(this.x - 6, k)){
                tiene_left = true;
            }
        }
        var tiene_right = false;
        for (var l = this.y + 5; l <= this.y + this.alto_ - 5; l++) {
            if(juego.cell_(this.x + this.ancho_ + 2, l)){
                tiene_right = true;
            }
        }

        //SI va pabajo
        if (this.dy >= 0) {
            if(this.y + this.alto_ > juego.alto_total_){
                this.y = juego.alto_total_ - this.alto_;
                this.dy = 0;
                this.jumping = false;
                this.falling = false;
            }
            if(tiene_down){
                this.dy = 0;
                this.jumping = false;
                this.falling = false;
                if(abajo_exacto){
                    this.y = Math.floor((this.y + this.alto_)/ 20) * 20 - this.alto_;
                }
            }
        }

        //Si va parriba
        /* Lo comento, porque nunca debería tocar el techo, no? ... lo dejo por si hago algo al saltar */
        else if (this.dy < 0) {
            if(tiene_up && arriba_exacto){
                this.dy = 0;
            }
        }
        
        //Si va a la derecha
        if (this.dx > 0) {

            if(this.x + this.ancho_ >= this.limite_derecha_){
                this.x = 10;
            }

            if(tiene_right && !juego.is_game_over_){
                this.dx = 0;
            }
        }
        //Si va a la izquierda
        else if (this.dx < 0) {

            if(this.x <= this.limite_izquierda_){
                this.x = juego.ancho_total_ - this.ancho_;
                this.y = this.y - 20;
            }

            if(tiene_left){
                this.dx = 0;
            }
        }
    };

    this.pinta_player_ = function(dt, ctx, counter, angulo_) {


        if(juego.wait_start_ > juego.timestamp_()){
            if(!juego.final_boss_){
                this.pinta_home_();
            }
            else{
                this.pinta_mum_();
            }
        }
        if(juego.is_game_over_){
            if(juego.you_win_){
                this.pinta_mum_in_calm_();
            }
            else{
                this.pinta_ok_();
            }
        }

        //Posición
        var x_player = this.x + (this.dx * dt);
        var y_player = this.y + (this.dy * dt);


        var player =  [
                        [  , 1,  ,  ,  ,  ],
                        [  , 1, 1, 1, 1, 1],
                        [  , 1, 1, 1, 1, 1],
                        [  , 1, 1, 1,  ,  ],
                        [  , 1, 1, 1, 1, 1],
                        [  , 1, 1, 1, 1, 1],
                        [  , 1, 1, 1, 1, 1],
                        [  , 1, 1, 1, 1, 1],
                        [  , 1, 1, 1, 1, 1],
                        [  , 1, 1, 1, 1, 1],
                        [ 1, 1, 1, 1, 1, 1],
                        [  ,  ,  ,  ,  ,  ],
                ];

        var player_izq =  [
                        [  ,  ,  ,  , 1,  ],
                        [ 1, 1, 1, 1, 1,  ],
                        [ 1, 1, 1, 1, 1,  ],
                        [  ,  , 1, 1, 1,  ],
                        [ 1, 1, 1, 1, 1,  ],
                        [ 1, 1, 1, 1, 1,  ],
                        [ 1, 1, 1, 1, 1,  ],
                        [ 1, 1, 1, 1, 1,  ],
                        [ 1, 1, 1, 1, 1,  ],
                        [ 1, 1, 1, 1, 1,  ],
                        [ 1, 1, 1, 1, 1, 1],
                        [  ,  ,  ,  ,  ,  ],
                ];

        var pistola =  [
                        [  ,  , 1,  ,  ,  , 1, 1,  ,  ,  ],
                        [  , 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [  ,  , 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [  ,  ,  , 1,  ,  ,  ,  ,  ,  ,  ],
                        [  ,  ,  , 1,  ,  ,  ,  ,  ,  ,  ],
                        [  ,  , 1, 1,  ,  ,  ,  ,  ,  ,  ]
                ];

        var pistola_izq =  [
                        [  ,  ,  , 1, 1,  ,  ,  , 1,  ,  ],
                        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  ],
                        [ 1, 1, 1, 1, 1, 1, 1, 1, 1,  ,  ],
                        [  ,  ,  ,  ,  ,  ,  , 1,  ,  ,  ],
                        [  ,  ,  ,  ,  ,  ,  , 1,  ,  ,  ],
                        [  ,  ,  ,  ,  ,  ,  , 1, 1,  ,  ]
                ];

        var size_pistola_pixel = 3;

        var pieses = [];
        pieses[0] = [[  ,  , 1,  ,  , 1,  ]];
        pieses[1] = [[  ,  , 1,  , 1,  ,  ]];
        pieses[2] = [[ 1,  ,  , 1,  ,  ,  ]];
        pieses[3] = [[  , 1,  , 1,  ,  ,  ]];
       

        var negativo = -1;
        if(juego.wait_start_ > juego.timestamp_()){
            this.angulo_ *= (negativo*1.1);
            this.angulo_ += (negativo*1);
            
            opacidad_jugador = 300/(juego.wait_start_-juego.timestamp_());
            if(opacidad_jugador>1){
                opacidad_jugador = 1;
            }
            this.angulo_ = 1000 * (opacidad_jugador - 1);
            //console.log(this.angulo_);
        }
        else if(this.tiempo_portal_ > juego.timestamp_()){
            if(!angulo_){

                this.angulo_ *= (negativo*1.1);
                this.angulo_ += (negativo*1);
                ctx.globalAlpha -= 0.005;
            }
            else{
                angulo_ = angulo_ * negativo * 1.1;
                this.angulo_ = angulo_ + negativo * 1;
                ctx.globalAlpha -= 0.009;
            }

            opacidad_jugador -= 0.01;
        }
        else{
            opacidad_jugador = 1;
            if(this.jumping){
                this.que_pie_ = 1;
                this.angulo_ = 0;
            }
            else if(this.left || this.right || juego.is_game_over_){
                if(juego.tween_frames_(counter, 30) < 0.5 ){
                    if(this.left){
                        this.que_pie_ = 2;
                    }
                    else{
                        this.que_pie_ = 0;
                    }
                    this.angulo_ = -2;
                }
                else if(this.left){
                    this.que_pie_ = 3;
                    this.angulo_ = 2;
                }
                else{
                    this.que_pie_ = 1;
                    this.angulo_ = 2;
                }

            }
            else{
                this.angulo_ = 0;
            }
        }



        ctx.save();
        ctx.translate(x_player + this.ancho_ / 2, y_player + this.alto_/2);

        //Pinto el halo ese chungo
        
        radius = juego.ancho_total_/3;
        ctx.beginPath();
        ctx.arc(0, 0, 300, 0, Math.PI * 2, false);

        var gradient = ctx.createRadialGradient(0, 0, radius*0.9, this.ancho_ / 2, this.alto_/2, 0);

        if((this.tiempo_atacado_ - juego.timestamp_())>1700){
            var random_halo = Math.random()/2;
            gradient.addColorStop(0,"rgba(255, 11, 11, 0)");
            gradient.addColorStop(1,"rgba(255, 11, 11, "+random_halo+")");
        }
        else if(this.tiempo_medical_ > juego.timestamp_()){
            gradient.addColorStop(0,"rgba(122, 255, 122, 0)");
            gradient.addColorStop(1,"rgba(122, 255, 122, 0.2)");
        }
        else if(!juego.is_game_over_){
            gradient.addColorStop(0,"rgba(251, 255, 243, 0)");
            gradient.addColorStop(1,"rgba(251, 255, 243, 0.6)");
        }
        ctx.fillStyle = gradient;
        ctx.fill();
        
        //Fin del halo chungo

        //efecto de saltitos
        ctx.rotate(this.angulo_*Math.PI/180);
        //Pinta jugador
        var que_jugador = player;
        var que_pistola = pistola;
        var x_pistola = -5;

        if(this.last_left_){
            que_jugador = player_izq;
            que_pistola = pistola_izq;
            x_pistola = -this.ancho_ + 5;
        }

        ctx.translate(- this.ancho_ / 2, - this.alto_/2);

        var color_player = "rgba(210,228,241,"+opacidad_jugador+")";

        juego.pinta_filas_columnas_(ctx, 0, 0, que_jugador, this.size_player_pixel_, color_player);
        //Pinta pies
        juego.pinta_filas_columnas_(ctx, 0, this.alto_ - this.size_player_pixel_, pieses[this.que_pie_], this.size_player_pixel_, color_player);
  

        //Pinta pistola
        //cambio el angulo_ de la pistola?
        this.angulo__pistola_ = 0;
        var color_pistola = "rgba(143,172,192,"+opacidad_jugador+")";
        ctx.translate(this.ancho_/2.5,  this.alto_/2);
        ctx.rotate(this.angulo_*Math.PI/180);
        if(!juego.is_game_over_){
            juego.pinta_filas_columnas_(ctx, x_pistola, 0, que_pistola, size_pistola_pixel, color_pistola);
        }
        ctx.restore();


        if(this.tiempo_atacado_ > juego.timestamp_() || this.tiempo_medical_ > juego.timestamp_()){

            var mayor_tiempo = this.tiempo_atacado_;
            if(this.tiempo_medical_  > this.tiempo_atacado_){
                mayor_tiempo = this.tiempo_medical_;
            }

            var diff_tiempo = mayor_tiempo - juego.timestamp_();
            
            var opacidad = diff_tiempo/2000;

            var ancho_cargador = this.ancho_*2;
            var alto_cargador = 5;
            var percent = this.salud_/juego.salud_inicial_;
            
            ctx.fillStyle="rgba(11, 204, 0, "+opacidad+")";
            if(percent < 0.8){
                ctx.fillStyle="rgba(224, 239, 20, "+opacidad+")";
            }
            if(percent < 0.6){
                ctx.fillStyle="rgba(204, 199, 0, "+opacidad+")";
            }
            if(percent < 0.4){
                ctx.fillStyle="rgba(239, 92, 20, "+opacidad+")";
            }
            if(percent < 0.2){
                ctx.fillStyle="rgba(255, 0, 0, "+opacidad+")";
            }

            ctx.fillRect(x_player - this.ancho_/2, y_player - 10, percent * ancho_cargador, alto_cargador);

            ctx.strokeStyle= "rgba(255,255,255,"+opacidad+")";
            ctx.lineWidth=1;
            ctx.strokeRect(x_player - this.ancho_/2, y_player - 10, ancho_cargador, alto_cargador);

        }


        return this.angulo_;

    };

    this.suena_dispara_ = function(){
        window.disparo_audio.pause();
        window.disparo_audio.currentTime = 0;
        window.disparo_audio.play();
        
        window.disparo_audio2.playbackRate = 0.5;
        window.disparo_audio2.pause();
        window.disparo_audio2.currentTime = 0;
        window.disparo_audio2.play();
        
    }

    this.suena_herida_ = function(){
        window.golpe_audio.pause();
        window.golpe_audio.currentTime = 0;
        window.golpe_audio.play();
    }

    this.suena_portal_ = function(){
        window.levelup_audio2.playbackRate = 1;
        window.levelup_audio2.pause();
        window.levelup_audio2.currentTime = 0;
        window.levelup_audio2.play();
    }

    this.suena_kit_ = function(){
       
    }

    this.pinta_home_ = function(){
        
        var home =  [
                        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1,  , 1,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1,  , 1, 1, 1, 1,  ,  , 1, 1, 1, 1, 1,  ,  , 1],
                        [ 1,  ,  , 1, 1,  , 1,  , 1, 1,  , 1,  , 1, 1, 1,  , 1, 1,  , 1, 1,  ,  ,  ,  , 1,  ,  , 1, 1,  ,  , 1],
                        [ 1,  ,  , 1, 1, 1, 1,  , 1, 1,  , 1,  , 1, 1,  , 1,  , 1,  , 1, 1, 1, 1,  ,  , 1, 1,  , 1, 1,  ,  , 1], 
                        [ 1,  ,  , 1, 1,  , 1,  , 1, 1,  , 1,  , 1, 1,  ,  ,  , 1,  , 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1], 
                        [ 1,  ,  , 1, 1,  , 1,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1,  , 1, 1, 1, 1,  ,  ,  ,  ,  , 1, 1,  ,  , 1], 
                        [ 1,  ,  , 1, 1,  , 1,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1,  , 1, 1, 1, 1,  ,  ,  ,  ,  , 1, 1,  ,  , 1], 
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [ 1,  , 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                        [ 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                ];

        var size_home = 3;
        var x_home = this.x + this.ancho_ + 20;
        var y_home = this.y - 60;

        juego.pinta_filas_columnas_(juego.ctx, x_home, y_home, home, size_home, "#ffffff");
    }

    this.pinta_mum_ = function(){
        
        var home =  [
                        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1,  , 1, 1,  , 1, 1,  ,  , 1],
                        [ 1,  ,  , 1, 1, 1,  , 1, 1,  , 1, 1,  , 1,  , 1, 1, 1,  , 1, 1,  , 1, 1,  , 1, 1,  ,  , 1],
                        [ 1,  ,  , 1, 1,  , 1,  , 1,  , 1, 1,  , 1,  , 1, 1,  , 1,  , 1,  , 1, 1,  , 1, 1,  ,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1,  , 1, 1,  , 1,  , 1, 1,  ,  ,  , 1,  , 1, 1,  , 1, 1,  ,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1,  , 1, 1,  , 1, 1,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [ 1,  , 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                        [ 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                ];

        var size_home = 3;
        var x_home = this.x + this.ancho_ + 20;
        var y_home = this.y - 60;

        juego.pinta_filas_columnas_(juego.ctx, x_home, y_home, home, size_home, "#ffffff");
    }

    this.pinta_mum_in_calm_ = function(){
        
        var home =  [
                        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1,  ,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1, 1, 1, 1,  , 1, 1, 1, 1,  , 1, 1, 1,  ,  , 1, 1, 1, 1,  ,  , 1],
                        [ 1,  ,  , 1, 1, 1,  , 1, 1,  , 1, 1,  , 1,  , 1, 1, 1,  , 1, 1,  ,  , 1, 1,  ,  ,  , 1, 1,  ,  ,  , 1, 1,  ,  ,  , 1, 1,  ,  ,  , 1, 1,  , 1,  , 1, 1,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1,  , 1,  , 1,  , 1, 1,  , 1,  , 1, 1,  , 1,  , 1,  ,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1, 1, 1,  ,  , 1, 1, 1,  ,  , 1, 1,  , 1,  , 1, 1, 1, 1,  ,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1,  , 1, 1,  , 1,  , 1, 1,  ,  ,  , 1,  ,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1, 1, 1,  ,  , 1, 1, 1,  ,  , 1, 1, 1,  ,  , 1, 1, 1, 1,  ,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1,  ,  ,  ,  ,  , 1,  , 1, 1,  ,  ,  , 1, 1,  ,  ,  , 1, 1,  ,  ,  , 1, 1,  ,  ,  ,  ,  ,  , 1,  ,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1,  ,  , 1, 1, 1, 1,  , 1, 1, 1, 1,  , 1, 1, 1, 1,  , 1, 1, 1, 1,  , 1, 1,  ,  ,  , 1, 1, 1, 1,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1, 1, 1, 1,  , 1, 1, 1, 1,  , 1,  , 1, 1, 1, 1,  ,  ,  ,  , 1, 1, 1,  ,  , 1, 1,  ,  ,  , 1, 1, 1, 1,  , 1,  ,  , 1,  , 1, 1,  , 1, 1,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1, 1,  ,  ,  ,  , 1, 1,  ,  ,  ,  , 1, 1,  ,  ,  ,  ,  ,  , 1, 1,  , 1,  , 1, 1,  ,  ,  , 1, 1,  , 1,  ,  , 1, 1,  ,  , 1, 1,  , 1, 1,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1, 1, 1,  ,  ,  , 1, 1,  ,  ,  ,  , 1, 1, 1, 1,  ,  ,  ,  , 1, 1,  , 1,  , 1, 1,  ,  ,  , 1, 1, 1, 1,  ,  , 1, 1,  ,  , 1, 1,  , 1, 1,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1, 1, 1,  ,  ,  , 1, 1,  ,  ,  ,  , 1, 1, 1, 1,  ,  ,  ,  , 1, 1, 1,  ,  , 1, 1,  ,  ,  , 1, 1, 1, 1,  ,  , 1, 1,  ,  , 1, 1,  , 1, 1,  , 1],
                        [ 1,  ,  , 1, 1,  ,  ,  , 1, 1,  ,  ,  ,  , 1, 1,  ,  ,  ,  ,  ,  ,  , 1,  ,  ,  ,  , 1, 1,  ,  ,  , 1, 1,  ,  ,  , 1, 1,  , 1,  ,  , 1, 1,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1, 1, 1,  , 1, 1, 1, 1,  ,  , 1, 1,  ,  ,  ,  , 1, 1, 1, 1,  ,  ,  ,  , 1, 1,  ,  ,  , 1, 1, 1, 1,  , 1, 1,  , 1,  ,  , 1, 1,  ,  , 1, 1,  , 1, 1,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [ 1,  , 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                        [ 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                ];

        var size_home = 3;
        var x_home = this.x + this.ancho_ + 20;
        var y_home = this.y - 90;

        juego.pinta_filas_columnas_(juego.ctx, x_home, y_home, home, size_home, "#ffffff");
    }

    this.pinta_ok_ = function(){
        
        var home =  [
                        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1, 1, 1,  , 1, 1,  ,  , 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1,  , 1,  , 1, 1,  , 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1,  , 1,  , 1, 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1,  , 1,  , 1, 1, 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1, 1, 1,  , 1, 1,  , 1, 1,  , 1, 1,  , 1, 1,  , 1, 1,  ,  , 1],
                        [ 1,  ,  , 1, 1, 1, 1,  , 1, 1,  ,  , 1,  , 1, 1,  , 1, 1,  , 1, 1,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , 1],
                        [ 1,  ,  , 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                        [ 1,  , 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                        [ 1, 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                        [ 1,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ],
                ];

        var size_home = 3;
        var x_home = this.x + this.ancho_ + 20;
        var y_home = this.y - 60;

        juego.pinta_filas_columnas_(juego.ctx, x_home, y_home, home, size_home, "#ffffff");
    }

    this.entra_portal_ = function(){
        var mini_portal_x = juego.portal_.x + juego.portal_.ancho_/3;
        var mini_portal_y = juego.portal_.y + juego.portal_.ancho_/3;
        var mini_portal_ancho = juego.portal_.ancho_/3;
        var mini_portal_alto = juego.portal_.ancho_/3;

        var overlap = juego.overlap_(this.x, this.y, this.ancho_, this.alto_, mini_portal_x, mini_portal_y, mini_portal_ancho, mini_portal_alto);
        return overlap;
    }

    this.entra_medical_ = function(){
        if(juego.moustro_final_){
            return;
        }
        if(typeof juego.medical_kit_.x === "undefined"){
            return false;
        }
        var overlap = juego.overlap_(this.x, this.y, this.ancho_, this.alto_, juego.medical_kit_.x, juego.medical_kit_.y, juego.medical_kit_.ancho_, juego.medical_kit_.alto_);
        return overlap;
    }


};
