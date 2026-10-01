package com.example.backend.core.factory;

import com.example.backend.presentation.dto.request.CustomerRegisterRequest;
import com.example.backend.core.entity.CustomerProfile;
import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserFactory {

    public CustomerProfile createCustomer(User user, CustomerRegisterRequest req) {

        CustomerProfile c = new CustomerProfile();
        c.setUser(user);
        c.setSportPreference(req.getSportPreference());
        c.setLevel(req.getLevel());
        c.setLocation(req.getLocation());

        return c;
    }

    public OwnerProfile createOwner(User user) {

        OwnerProfile o = new OwnerProfile();
        o.setUser(user);

        return o;
    }
}